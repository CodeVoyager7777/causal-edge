import asyncio
import logging
from app.db.database import SessionLocal
from app.db.models import Vehicle
from app.simulator.vehicle import VirtualVehicle

logger = logging.getLogger(__name__)

class SimulationEngine:
    def __init__(self):
        self.vehicles: dict[int, VirtualVehicle] = {}
        self.tasks: list[asyncio.Task] = []

    def start(self):
        logger.info("Starting SimulationEngine...")
        db = SessionLocal()
        try:
            db_vehicles = db.query(Vehicle).all()
            for v in db_vehicles:
                vv = VirtualVehicle(vehicle_id=v.id, name=v.name)
                self.vehicles[v.id] = vv
                # Spawn background task
                task = asyncio.create_task(vv.run())
                self.tasks.append(task)
                vv._task = task
            logger.info(f"Spawned simulation tasks for {len(self.vehicles)} vehicles.")
        except Exception as e:
            logger.error(f"Failed to start SimulationEngine: {e}")
        finally:
            db.close()

    def stop(self):
        logger.info("Stopping SimulationEngine...")
        for vv in self.vehicles.values():
            vv.stop()
        logger.info("SimulationEngine stopped.")

# Singleton instance
simulator_engine = SimulationEngine()
