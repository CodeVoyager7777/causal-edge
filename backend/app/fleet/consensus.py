import asyncio
import logging
from datetime import datetime
from sqlalchemy import func

from app.config import (
    CONSENSUS_QUORUM_RATIO, CONSENSUS_WINDOW_SECONDS,
    CONSENSUS_MIN_VOTES, RISK_LOW_WATERMARK
)
from app.pipeline.bus import event_bus
from app.db.database import SessionLocal
from app.db.models import ConsensusRound, ConsensusVote, ComponentRiskState
from app.simulator.engine import simulator_engine

logger = logging.getLogger(__name__)

class FleetConsensusEngine:
    def __init__(self):
        self.queue = asyncio.Queue()
        self._running = False
        self._task = None
        self.active_rounds = set()  # set of subsystem names with active rounds

    def start(self):
        self._running = True
        event_bus.subscribe("anomalies", self.queue)
        self._task = asyncio.create_task(self.run())
        logger.info("FleetConsensusEngine started and subscribed to 'anomalies'")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        event_bus.unsubscribe("anomalies", self.queue)
        logger.info("FleetConsensusEngine stopped.")

    async def run(self):
        while self._running:
            try:
                msg = await self.queue.get()
                subsystem = msg["subsystem"]
                detector_v_id = msg["vehicle_id"]

                # If there's already an active round for this subsystem, skip starting a new one
                if subsystem in self.active_rounds:
                    continue
                
                self.active_rounds.add(subsystem)
                
                # Spawn a background task to handle this specific consensus round
                asyncio.create_task(self.process_round(subsystem, detector_v_id))

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in FleetConsensusEngine loop: {e}")

    async def process_round(self, subsystem: str, detector_v_id: str):
        db = SessionLocal()
        round_id = None
        try:
            # Create a new round
            new_round = ConsensusRound(
                subsystem=subsystem,
                fault_pattern=f"{subsystem}_fault",
                result="pending"
            )
            db.add(new_round)
            db.commit()
            round_id = new_round.id
            
            logger.info(f"Consensus round {round_id} started for {subsystem} (detector: {detector_v_id})")
            
            # The detector inherently votes True
            detect_vote = ConsensusVote(
                round_id=round_id,
                vehicle_id=detector_v_id,
                vote=True,
                confidence=1.0
            )
            db.add(detect_vote)
            db.commit()
        except Exception as e:
            logger.error(f"Error creating consensus round: {e}")
            db.close()
            self.active_rounds.discard(subsystem)
            return
            
        # Wait for the consensus window
        await asyncio.sleep(CONSENSUS_WINDOW_SECONDS)

        try:
            # Tally votes across all vehicles
            total_vehicles = len(simulator_engine.vehicles)
            
            # Get current risk states for this subsystem across all vehicles
            risk_states = db.query(ComponentRiskState).filter(
                ComponentRiskState.component == subsystem
            ).all()
            
            risk_map = {rs.vehicle_id: rs.risk_score for rs in risk_states}
            
            true_votes = 0
            for v_id in simulator_engine.vehicles.keys():
                # We already counted the detector's vote
                if v_id == detector_v_id:
                    true_votes += 1
                    continue
                
                risk = risk_map.get(v_id, 0.0)
                vote = bool(risk > RISK_LOW_WATERMARK)
                if vote:
                    true_votes += 1
                
                # Record the vote
                v = ConsensusVote(
                    round_id=round_id,
                    vehicle_id=v_id,
                    vote=vote,
                    confidence=min(1.0, risk) if vote else 1.0
                )
                db.add(v)
            
            ratio = true_votes / total_vehicles if total_vehicles > 0 else 0
            
            # Determine outcome
            is_confirmed = (ratio >= CONSENSUS_QUORUM_RATIO) and (true_votes >= CONSENSUS_MIN_VOTES)
            
            r = db.query(ConsensusRound).filter(ConsensusRound.id == round_id).first()
            if r:
                r.result = "confirmed" if is_confirmed else "rejected"
                r.confidence = ratio
                r.resolved_at = datetime.utcnow()
                db.commit()
            
            logger.info(f"Consensus round {round_id} for {subsystem} resolved as {r.result.upper()} ({true_votes}/{total_vehicles} votes)")
            
            if is_confirmed:
                await event_bus.publish("consensus_reached", {
                    "round_id": round_id,
                    "subsystem": subsystem,
                    "confidence": ratio
                })
        
        except Exception as e:
            logger.error(f"Error resolving consensus round {round_id}: {e}")
        finally:
            db.close()
            self.active_rounds.discard(subsystem)

fleet_consensus = FleetConsensusEngine()
