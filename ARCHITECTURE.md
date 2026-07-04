# Locked Architecture

This architecture is final for the duration of the build. See root README for
module progress.

## Stack
- Backend: Python 3.12, FastAPI (REST + WebSocket, single process)
- Simulation: asyncio background tasks in the same process
- ML: scikit-learn IsolationForest (per-sensor anomaly scoring)
- Causal graph: NetworkX directed weighted graph + custom BFS propagation
- DB: SQLite via SQLAlchemy
- Crypto lineage: SHA-256 hash-chain
- Frontend: React 18 + Vite + Tailwind CSS
- Charts: Recharts. Graph viz: react-force-graph-2d
- Realtime: native WebSocket at `/ws/live`

## Module order
1. Project skeleton
2. Virtual vehicle + sensor simulation
3. Data pipeline
4. AI anomaly detection
5. Causal graph engine
6. Adaptive sampling engine
7. Fleet consensus engine
8. Maintenance lineage (hash-chain)
9. Backend API integration
10. Frontend dashboard
11. Real-time visualization
12. Demo mode

## DB schema
See `backend/app/db/models.py` — this is the single source of truth for
the schema; this file only describes intent.

- vehicles
- sensor_readings
- anomaly_events
- causal_propagation_events
- component_risk_state
- consensus_rounds / consensus_votes
- maintenance_records (hash-chained)
- fault_injections

## Causal graph topology (locked)
```
WheelBearing --0.85--> Suspension --0.70--> ChassisVibration --0.55--> Drivetrain --0.65--> MotorTemp --0.45--> BatteryTemp
WheelBearing --0.60--> Wheel --0.50--> TirePressure
Suspension --0.40--> Brake
```

## Demo flow (locked)
Start system → 5 virtual vehicles live → inject wheel-bearing fault on
Vehicle-03 → sensors spike → AI flags anomaly → causal graph propagates
risk → adaptive sampler ramps Vehicle-03's tick rate → fleet consensus
quorum confirms pattern → maintenance record hash-committed → dashboard
reflects all of it live.
