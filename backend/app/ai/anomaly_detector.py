import asyncio
import logging
from app.config import ANOMALY_SCORE_THRESHOLD
from app.pipeline.bus import event_bus
from app.db.database import SessionLocal
from app.db.models import AnomalyEvent
from app.simulator.sensors import NOMINAL_VALUES

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        self.queue = asyncio.Queue()
        self._task = None

    def start(self):
        event_bus.subscribe("sensor_readings", self.queue)
        self._task = asyncio.create_task(self.run())
        logger.info("AnomalyDetector started (Z-Score mode) and subscribed to 'sensor_readings'")

    def stop(self):
        if self._task:
            self._task.cancel()
        event_bus.unsubscribe("sensor_readings", self.queue)
        logger.info("AnomalyDetector stopped.")

    async def run(self):
        while True:
            try:
                message = await self.queue.get()
                readings = message.get("readings", [])
                
                db = SessionLocal()
                try:
                    for r in readings:
                        v_id = r["vehicle_id"]
                        sub = r["subsystem"]
                        stype = r["sensor_type"]
                        val = r["value"]
                        
                        # Z-Score Detection
                        mean, std_dev = NOMINAL_VALUES.get(sub, {}).get(stype, (0.0, 1.0))
                        if std_dev == 0:
                            std_dev = 1.0
                            
                        z_score = abs(val - mean) / std_dev
                        
                        # Map z-score to risk_score (0 to 1)
                        # Z < 3 is healthy (risk < 0.5)
                        # Z > 3 is anomalous
                        risk_score = min(1.0, z_score / 6.0)  # Z=6 maps to risk 1.0, Z=3 maps to risk 0.5
                        
                        if risk_score > ANOMALY_SCORE_THRESHOLD:
                            logger.warning(f"Anomaly detected! Vehicle:{v_id} {sub}.{stype}={val} (Z:{z_score:.1f}) Risk:{risk_score:.2f}")
                            
                            anomaly = AnomalyEvent(
                                vehicle_id=v_id,
                                subsystem=sub,
                                sensor_type=stype,
                                score=risk_score,
                                threshold=ANOMALY_SCORE_THRESHOLD,
                                description=f"Significant deviation detected in {sub}.{stype} with value {val}"
                            )
                            db.add(anomaly)
                            db.commit()
                            
                            await event_bus.publish("anomalies", {
                                "anomaly_event_id": anomaly.id,
                                "vehicle_id": v_id,
                                "subsystem": sub,
                                "sensor_type": stype,
                                "risk_score": risk_score
                            })
                finally:
                    db.close()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in AnomalyDetector loop: {e}")

anomaly_detector = AnomalyDetector()
