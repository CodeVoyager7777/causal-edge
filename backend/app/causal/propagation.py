import asyncio
import logging
from collections import deque
from datetime import datetime

from app.config import RISK_DECAY_FLOOR, RISK_HALF_LIFE_SECONDS
from app.pipeline.bus import event_bus
from app.db.database import SessionLocal
from app.db.models import CausalPropagationEvent, ComponentRiskState
from app.causal.graph import causal_graph

logger = logging.getLogger(__name__)

class CausalEngine:
    def __init__(self):
        self.queue = asyncio.Queue()
        self._tasks = []
        self._running = False

    def start(self):
        self._running = True
        event_bus.subscribe("anomalies", self.queue)
        self._tasks.append(asyncio.create_task(self.run_propagation()))
        self._tasks.append(asyncio.create_task(self.run_decay()))
        logger.info("CausalEngine started (propagation + decay loops)")

    def stop(self):
        self._running = False
        for t in self._tasks:
            t.cancel()
        event_bus.unsubscribe("anomalies", self.queue)
        logger.info("CausalEngine stopped.")

    async def run_propagation(self):
        while self._running:
            try:
                msg = await self.queue.get()
                v_id = msg["vehicle_id"]
                subsystem = msg["subsystem"]
                risk_score = msg["risk_score"]
                anomaly_id = msg["anomaly_event_id"]

                if subsystem not in causal_graph.nodes:
                    continue

                db = SessionLocal()
                try:
                    bfs_queue = deque([(subsystem, risk_score)])
                    visited = set([subsystem])
                    
                    while bfs_queue:
                        curr_node, curr_risk = bfs_queue.popleft()
                        
                        risk_state = db.query(ComponentRiskState).filter(
                            ComponentRiskState.vehicle_id == v_id,
                            ComponentRiskState.component == curr_node
                        ).first()
                        
                        if not risk_state:
                            risk_state = ComponentRiskState(
                                vehicle_id=v_id,
                                component=curr_node,
                                risk_score=curr_risk
                            )
                            db.add(risk_state)
                        else:
                            risk_state.risk_score = max(risk_state.risk_score, curr_risk)
                            risk_state.updated_at = datetime.utcnow()

                        db.commit()

                        for neighbor in causal_graph.successors(curr_node):
                            weight = causal_graph.edges[curr_node, neighbor]['weight']
                            next_risk = curr_risk * weight
                            
                            if next_risk >= RISK_DECAY_FLOOR and neighbor not in visited:
                                visited.add(neighbor)
                                bfs_queue.append((neighbor, next_risk))
                                
                                prop_event = CausalPropagationEvent(
                                    anomaly_event_id=anomaly_id,
                                    vehicle_id=v_id,
                                    from_component=curr_node,
                                    to_component=neighbor,
                                    propagated_risk=next_risk
                                )
                                db.add(prop_event)
                                logger.info(f"Causal cascade: {curr_node} -> {neighbor} (Risk: {next_risk:.2f}) on Vehicle {v_id}")
                                
                                await event_bus.publish("causal_propagation", {
                                    "vehicle_id": v_id,
                                    "from": curr_node,
                                    "to": neighbor,
                                    "risk": next_risk
                                })
                    db.commit()
                finally:
                    db.close()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in CausalEngine propagation loop: {e}")

    async def run_decay(self):
        decay_interval = 2.0
        multiplier = 0.5 ** (decay_interval / RISK_HALF_LIFE_SECONDS)

        while self._running:
            try:
                await asyncio.sleep(decay_interval)
                db = SessionLocal()
                try:
                    states = db.query(ComponentRiskState).all()
                    for state in states:
                        if state.risk_score > 0:
                            new_risk = state.risk_score * multiplier
                            if new_risk < RISK_DECAY_FLOOR:
                                new_risk = 0.0
                            state.risk_score = new_risk
                    db.commit()
                finally:
                    db.close()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in CausalEngine decay loop: {e}")
                await asyncio.sleep(1)

causal_engine = CausalEngine()
