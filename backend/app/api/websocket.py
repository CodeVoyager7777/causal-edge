import asyncio
import json
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.pipeline.bus import event_bus

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._running = False
        self._tasks = []
        
        self.q_readings = asyncio.Queue()
        self.q_anomalies = asyncio.Queue()
        self.q_consensus = asyncio.Queue()
        self.q_causal = asyncio.Queue()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        text = json.dumps(message, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(text)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

    def start(self):
        self._running = True
        event_bus.subscribe("sensor_readings", self.q_readings)
        event_bus.subscribe("anomalies", self.q_anomalies)
        event_bus.subscribe("consensus_reached", self.q_consensus)
        event_bus.subscribe("causal_propagation", self.q_causal)
        
        self._tasks.append(asyncio.create_task(self._listen(self.q_readings, "sensor_readings")))
        self._tasks.append(asyncio.create_task(self._listen(self.q_anomalies, "anomaly")))
        self._tasks.append(asyncio.create_task(self._listen(self.q_consensus, "consensus_reached")))
        self._tasks.append(asyncio.create_task(self._listen(self.q_causal, "causal_propagation")))
        
        logger.info("WebSocket Manager started broadcasting.")

    def stop(self):
        self._running = False
        for t in self._tasks:
            t.cancel()
        event_bus.unsubscribe("sensor_readings", self.q_readings)
        event_bus.unsubscribe("anomalies", self.q_anomalies)
        event_bus.unsubscribe("consensus_reached", self.q_consensus)
        event_bus.unsubscribe("causal_propagation", self.q_causal)

    async def _listen(self, queue: asyncio.Queue, msg_type: str):
        while self._running:
            try:
                data = await queue.get()
                await self.broadcast({"type": msg_type, "data": data})
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"WebSocket Manager listen error: {e}")

ws_manager = ConnectionManager()

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
