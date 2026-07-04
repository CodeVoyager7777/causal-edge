"""
Causal-Graph Edge AI Fleet System — Backend Entrypoint.

Module 1 (skeleton) responsibilities only:
- App wiring, CORS
- DB initialization
- Fleet seeding (creates Vehicle rows from config if they don't exist)
- Health check endpoint

Later modules attach their routers/background tasks here without altering
anything already wired up.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import VEHICLE_NAMES
from app.db.database import init_db, SessionLocal
from app.db.models import Vehicle
from app.simulator.engine import simulator_engine
from app.ai.anomaly_detector import anomaly_detector
from app.causal.propagation import causal_engine
from app.adaptive.sampler import adaptive_sampler
from app.fleet.consensus import fleet_consensus
from app.ledger.chain import maintenance_ledger
from app.api.websocket import ws_manager, router as ws_router
from app.api.faults import router as faults_router


def seed_fleet():
    """Ensure the configured fleet of vehicles exists in the DB. Idempotent."""
    db = SessionLocal()
    try:
        existing = {v.name for v in db.query(Vehicle).all()}
        for name in VEHICLE_NAMES:
            if name not in existing:
                db.add(Vehicle(name=name, status="nominal"))
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    init_db()
    seed_fleet()
    simulator_engine.start()
    anomaly_detector.start()
    causal_engine.start()
    adaptive_sampler.start()
    fleet_consensus.start()
    maintenance_ledger.start()
    ws_manager.start()
    yield
    # --- shutdown ---
    simulator_engine.stop()
    anomaly_detector.stop()
    causal_engine.stop()
    adaptive_sampler.stop()
    fleet_consensus.stop()
    maintenance_ledger.stop()
    ws_manager.stop()


app = FastAPI(title="Causal-Graph Edge AI Fleet System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local demo only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    db = SessionLocal()
    try:
        vehicle_count = db.query(Vehicle).count()
    finally:
        db.close()
    return {
        "status": "ok",
        "service": "causaledge-backend",
        "fleet_size": vehicle_count,
    }


# NOTE: routers from later modules (vehicles, faults, causal, consensus,
# maintenance, demo, websocket) are included here as they are built.

app.include_router(ws_router)
app.include_router(faults_router)
