import asyncio
import hashlib
import json
import logging
from datetime import datetime

from app.pipeline.bus import event_bus
from app.db.database import SessionLocal
from app.db.models import MaintenanceRecord, ConsensusRound

logger = logging.getLogger(__name__)

class MaintenanceLedger:
    def __init__(self):
        self.queue = asyncio.Queue()
        self._running = False
        self._task = None

    def start(self):
        self._running = True
        event_bus.subscribe("consensus_reached", self.queue)
        self._task = asyncio.create_task(self.run())
        logger.info("MaintenanceLedger started and subscribed to 'consensus_reached'")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        event_bus.unsubscribe("consensus_reached", self.queue)
        logger.info("MaintenanceLedger stopped.")

    async def run(self):
        while self._running:
            try:
                msg = await self.queue.get()
                round_id = msg.get("round_id")
                subsystem = msg.get("subsystem")
                confidence = msg.get("confidence")
                
                db = SessionLocal()
                try:
                    # In a real scenario we might tie this to a specific vehicle.
                    # Since it's a fleet consensus round, we'll just assign it to vehicle 1 or a dummy ID for the fleet.
                    # Let's get the first vehicle from the round's votes if possible, or just default to 1
                    vehicle_id = 1
                    
                    description = f"Consensus confirmed anomaly in {subsystem} with {confidence*100:.1f}% confidence (Round {round_id})"
                    
                    last_record = db.query(MaintenanceRecord).order_by(MaintenanceRecord.id.desc()).first()
                    
                    if last_record:
                        prev_hash = last_record.record_hash
                    else:
                        prev_hash = hashlib.sha256(b"GENESIS_BLOCK").hexdigest()
                        
                    timestamp_str = datetime.utcnow().isoformat()
                    
                    # Create signature/hash payload
                    payload = f"{vehicle_id}|{subsystem}|{description}"
                    hash_input = f"{prev_hash}{payload}{timestamp_str}".encode('utf-8')
                    current_hash = hashlib.sha256(hash_input).hexdigest()
                    
                    new_record = MaintenanceRecord(
                        vehicle_id=vehicle_id,
                        component=subsystem,
                        description=description,
                        severity="high" if confidence > 0.8 else "medium",
                        record_hash=current_hash,
                        prev_hash=prev_hash,
                        signature="auto_system_signature"
                    )
                    db.add(new_record)
                    db.commit()
                    
                    logger.info(f"Ledger committed block {new_record.id} for round {round_id} with hash {current_hash[:8]}...")
                except Exception as e:
                    logger.error(f"Error committing block to ledger: {e}")
                finally:
                    db.close()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in MaintenanceLedger loop: {e}")

    def verify_chain(self) -> bool:
        db = SessionLocal()
        try:
            entries = db.query(MaintenanceRecord).order_by(MaintenanceRecord.id.asc()).all()
            if not entries:
                return True
                
            prev_hash = hashlib.sha256(b"GENESIS_BLOCK").hexdigest()
            for entry in entries:
                if entry.prev_hash != prev_hash:
                    logger.error(f"Chain broken at entry {entry.id}: prev_hash mismatch.")
                    return False
                prev_hash = entry.record_hash
                
            logger.info("Ledger chain verified successfully.")
            return True
        finally:
            db.close()

maintenance_ledger = MaintenanceLedger()
