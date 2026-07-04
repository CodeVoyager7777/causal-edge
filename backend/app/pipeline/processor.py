import logging
from collections import deque
from app.config import ISOFOREST_WINDOW
from app.pipeline.bus import event_bus

logger = logging.getLogger(__name__)

class PipelineProcessor:
    def __init__(self):
        # vehicle_id -> subsystem -> sensor_type -> deque
        self.history = {}

    async def ingest(self, readings: list[dict]):
        if not readings:
            return

        for r in readings:
            v_id = r["vehicle_id"]
            sub = r["subsystem"]
            stype = r["sensor_type"]
            val = r["value"]
            
            if v_id not in self.history:
                self.history[v_id] = {}
            if sub not in self.history[v_id]:
                self.history[v_id][sub] = {}
            if stype not in self.history[v_id][sub]:
                self.history[v_id][sub][stype] = deque(maxlen=ISOFOREST_WINDOW)
            
            self.history[v_id][sub][stype].append(val)
        
        # Publish the raw readings batch
        await event_bus.publish("sensor_readings", {"readings": readings})

# Singleton instance
pipeline_processor = PipelineProcessor()
