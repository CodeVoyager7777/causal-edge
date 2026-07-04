import asyncio
import logging

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self.subscribers = {}

    def subscribe(self, topic: str, queue: asyncio.Queue):
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(queue)
        logger.info(f"New subscriber for topic '{topic}'")

    def unsubscribe(self, topic: str, queue: asyncio.Queue):
        if topic in self.subscribers and queue in self.subscribers[topic]:
            self.subscribers[topic].remove(queue)

    async def publish(self, topic: str, message: dict):
        if topic in self.subscribers:
            for queue in self.subscribers[topic]:
                # Since queues have no maxsize by default, put_nowait is safe
                queue.put_nowait(message)

# Singleton instance
event_bus = EventBus()
