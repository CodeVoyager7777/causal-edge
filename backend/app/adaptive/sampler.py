import asyncio
import logging
from sqlalchemy import func

from app.config import (
    RISK_HIGH_WATERMARK, RISK_LOW_WATERMARK,
    MIN_TICK_SECONDS, MAX_TICK_SECONDS, BASE_TICK_SECONDS
)
from app.db.database import SessionLocal
from app.db.models import ComponentRiskState
from app.simulator.engine import simulator_engine

logger = logging.getLogger(__name__)

class AdaptiveSampler:
    def __init__(self):
        self._running = False
        self._task = None

    def start(self):
        self._running = True
        self._task = asyncio.create_task(self.run())
        logger.info("AdaptiveSampler started.")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("AdaptiveSampler stopped.")

    async def run(self):
        while self._running:
            try:
                db = SessionLocal()
                try:
                    # Query max risk per vehicle
                    results = db.query(
                        ComponentRiskState.vehicle_id,
                        func.max(ComponentRiskState.risk_score).label("max_risk")
                    ).group_by(ComponentRiskState.vehicle_id).all()
                    
                    risk_map = {row.vehicle_id: row.max_risk for row in results}

                    # Iterate over active vehicles in the simulator memory
                    for v_id, vv in simulator_engine.vehicles.items():
                        max_risk = risk_map.get(v_id, 0.0)
                        
                        new_rate = BASE_TICK_SECONDS
                        if max_risk >= RISK_HIGH_WATERMARK:
                            new_rate = MIN_TICK_SECONDS
                        elif max_risk <= RISK_LOW_WATERMARK:
                            new_rate = MAX_TICK_SECONDS
                        else:
                            # Linear scale between MIN and MAX (inverted: higher risk = lower seconds)
                            # Or simple fallback to BASE:
                            new_rate = BASE_TICK_SECONDS
                        
                        if abs(vv.tick_rate - new_rate) > 0.01:
                            logger.info(f"AdaptiveSampler: Changing {vv.name} tick rate {vv.tick_rate:.2f}s -> {new_rate:.2f}s (Max Risk: {max_risk:.2f})")
                            vv.tick_rate = new_rate

                finally:
                    db.close()
                
                await asyncio.sleep(2.0)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in AdaptiveSampler loop: {e}")
                await asyncio.sleep(1)

adaptive_sampler = AdaptiveSampler()
