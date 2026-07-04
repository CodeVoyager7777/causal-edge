import asyncio
import logging
from app.config import BASE_TICK_SECONDS
from app.simulator.sensors import generate_all_readings
from app.pipeline.processor import pipeline_processor

logger = logging.getLogger(__name__)

class VirtualVehicle:
    def __init__(self, vehicle_id: int, name: str):
        self.vehicle_id = vehicle_id
        self.name = name
        self.tick_rate = BASE_TICK_SECONDS
        self._running = False
        self._task = None

    async def run(self):
        self._running = True
        logger.info(f"Vehicle {self.name} (ID: {self.vehicle_id}) started simulation loop.")
        while self._running:
            try:
                readings = generate_all_readings(self.vehicle_id)
                # Module 3: Push to the pipeline
                await pipeline_processor.ingest(readings)
                print(f"{self.name} ingested {len(readings)} sensor readings into pipeline.")
                
                # Sleep for the tick_rate
                await asyncio.sleep(self.tick_rate)
            except asyncio.CancelledError:
                self._running = False
                logger.info(f"Vehicle {self.name} simulation loop cancelled.")
                break
            except Exception as e:
                logger.error(f"Error in {self.name} simulation loop: {e}")
                await asyncio.sleep(1)

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
