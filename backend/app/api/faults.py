"""
Fault Injection API — deterministic, per-fault causal inference with RUL,
propagation mechanisms, AI narrative, and maintenance recommendations.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.pipeline.processor import pipeline_processor
from app.config import SENSOR_SPECS, CAUSAL_EDGES
from app.db.database import SessionLocal
from app.db.models import ComponentRiskState

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fault", tags=["faults"])

# ──────────────────────────────────────────────
# Propagation mechanism descriptions per edge.
# Key = (from_component, to_component)
# ──────────────────────────────────────────────
PROPAGATION_MECHANISMS = {
    ("WheelBearing", "Suspension"):       "Bearing vibration transfers rotational imbalance into the suspension linkage, increasing cyclic stress on dampers.",
    ("Suspension", "ChassisVibration"):   "Compromised suspension amplifies road-induced forces, transmitting unfiltered vibration into the chassis frame.",
    ("ChassisVibration", "Drivetrain"):   "Chassis resonance creates torsional stress on driveshaft joints, accelerating universal joint wear.",
    ("WheelBearing", "Wheel"):            "Degraded bearing races increase friction heat and radial play, causing tire contact patch instability.",
    ("Wheel", "TirePressure"):            "Wheel imbalance from bearing wear creates uneven tire loading, leading to pressure distribution anomalies.",
    ("Drivetrain", "MotorTemp"):          "Driveshaft torsional load spikes cause the motor to draw excess current, raising winding temperatures.",
    ("MotorTemp", "BatteryTemp"):         "Motor thermal dissipation heats adjacent battery cells, pushing them toward thermal runaway threshold.",
    ("Suspension", "Brake"):              "Lateral suspension flex increases brake disc misalignment, causing uneven pad contact and accelerated wear.",
}

# ──────────────────────────────────────────────
# Fault catalogue
# ──────────────────────────────────────────────
FAULT_CATALOGUE = {
    "WheelBearing": {
        "label": "Wheel Bearing Failure",
        "root_sensor_type": "vibration_mm_s",
        "root_sensor_value": 45.0,
        "icon": "⚙️",
        "description": "Extreme vibration detected in wheel bearing assembly. Spalling has begun on the inner race.",
        "ai_narrative": [
            "Wheel Bearing vibration spiked to 45 mm/s — 18× above nominal. Spalling detected on inner race.",
            "Rotational imbalance increased by 82%. Stress wave propagating to suspension linkage.",
            "Suspension damper fatigue index elevated. Chassis resonance beginning at 12.4 Hz.",
            "Drivetrain driveshaft joints under torsional overload. Motor current draw rising.",
            "Causal chain complete. 9 downstream components at risk. Immediate bearing replacement recommended.",
        ],
        "maintenance": "Replace wheel bearing assembly. Inspect wheel hub for spalling marks. Realign suspension geometry.",
    },
    "BatteryTemp": {
        "label": "Battery Thermal Runaway",
        "root_sensor_type": "temperature_c",
        "root_sensor_value": 98.0,
        "icon": "🔋",
        "description": "Battery temperature exceeded 98°C — thermal runaway threshold breached. Cell venting imminent.",
        "ai_narrative": [
            "Battery cell temperature reached 98°C — 63°C above safe operating limit.",
            "Electrolyte decomposition beginning. Gas pressure inside cells increasing.",
            "Motor thermal coupling detected. Adjacent motor windings heating above 120°C.",
            "Thermal propagation risk to chassis. Emergency cooling system activation recommended.",
            "Causal chain complete. Estimated time to full cell failure: 4.2 hours without intervention.",
        ],
        "maintenance": "Disconnect battery pack immediately. Replace thermal management system. Inspect adjacent motor windings for heat damage.",
    },
    "Brake": {
        "label": "Brake System Failure",
        "root_sensor_type": "pad_wear_pct",
        "root_sensor_value": 97.0,
        "icon": "🛑",
        "description": "Brake pad wear at 97%. Metal-on-metal contact detected. Disc surface temperature spiking.",
        "ai_narrative": [
            "Brake pad wear at 97% — metal-on-metal contact imminent. Friction coefficient dropped 44%.",
            "Disc surface temperature 340°C and rising. Thermal stress cracking probability: 71%.",
            "Vibration from disc warping transmitting into suspension. Lateral stability reduced.",
            "Chassis vibration coupling detected. Vehicle stopping distance increased by estimated 38%.",
            "Causal chain complete. Safety-critical failure. Immediate maintenance stop required.",
        ],
        "maintenance": "Replace brake pads and resurface or replace discs. Inspect brake lines for heat damage. Check ABS sensor calibration.",
    },
    "Suspension": {
        "label": "Suspension Collapse",
        "root_sensor_type": "displacement_mm",
        "root_sensor_value": 88.0,
        "icon": "🔩",
        "description": "Suspension displacement at 88 mm — 8.8× nominal. Coil spring fracture detected.",
        "ai_narrative": [
            "Suspension displacement reached 88 mm — spring fracture signature confirmed via accelerometry.",
            "Load redistribution detected across chassis. Chassis vibration index increased 3.4×.",
            "Drivetrain CV joint angles now exceed design limits. Accelerated wear beginning.",
            "Brake caliper misalignment detected. Uneven pad contact. Stopping distance impacted.",
            "Causal chain complete. Vehicle handling compromised. Do not operate above 20 km/h.",
        ],
        "maintenance": "Replace fractured coil spring and inspect shock absorber. Re-align all four wheels. Check CV joint boots.",
    },
    "MotorTemp": {
        "label": "Motor Overheating",
        "root_sensor_type": "temperature_c",
        "root_sensor_value": 185.0,
        "icon": "🌡️",
        "description": "Motor winding temperature at 185°C — insulation breakdown threshold exceeded.",
        "ai_narrative": [
            "Motor winding temperature reached 185°C. Insulation class rating (Class H, 180°C) exceeded.",
            "Winding resistance increasing due to thermal degradation. Efficiency dropped 22%.",
            "Thermal coupling to battery pack detected. Cell temperature rising 2.3°C/min.",
            "Motor output torque reduced 18%. Drivetrain compensating — increased mechanical stress.",
            "Causal chain complete. Motor replacement imminent without active cooling intervention.",
        ],
        "maintenance": "Replace motor winding insulation or full motor. Flush and refill thermal management coolant. Check inverter thermal paste.",
    },
}

# ──────────────────────────────────────────────
# Baseline Remaining Useful Life (hours) per
# component when at nominal health (0 risk).
# ──────────────────────────────────────────────
BASELINE_RUL = {
    "WheelBearing":    500,
    "Suspension":      800,
    "ChassisVibration": 1200,
    "Drivetrain":      1000,
    "Wheel":           600,
    "TirePressure":    400,
    "MotorTemp":       900,
    "BatteryTemp":     700,
    "Brake":           350,
}

# Maintenance recommendations per component
COMPONENT_MAINTENANCE = {
    "WheelBearing":    "Replace bearing assembly. Inspect hub for race damage.",
    "Suspension":      "Inspect dampers and springs. Re-torque linkage bolts.",
    "ChassisVibration":"Inspect chassis welds and cross-members for fatigue cracks.",
    "Drivetrain":      "Inspect CV joints and driveshaft. Lubricate universal joints.",
    "Wheel":           "Balance and inspect wheel rim. Check for lateral runout.",
    "TirePressure":    "Inspect tire for sidewall damage. Recalibrate TPMS sensor.",
    "MotorTemp":       "Flush coolant circuit. Inspect motor windings for heat damage.",
    "BatteryTemp":     "Run full cell capacity test. Replace thermal interface material.",
    "Brake":           "Replace pads and resurface disc. Bleed brake hydraulics.",
}


def _compute_causal_chain(root: str, root_risk: float) -> list[dict]:
    """
    BFS over CAUSAL_EDGES from the root component.
    Returns enriched component dicts with mechanism, cause, and maintenance.
    """
    from collections import deque

    adj: dict[str, list[tuple[str, float]]] = {}
    for u, v, w in CAUSAL_EDGES:
        adj.setdefault(u, []).append((v, w))

    results = []
    queue = deque([(root, root_risk, 0, None)])  # (node, risk, depth, caused_by)
    visited = {root}

    while queue:
        node, risk, depth, caused_by = queue.popleft()
        baseline = BASELINE_RUL.get(node, 500)
        rul_hours = max(0, round(baseline * (1 - risk)))

        if risk >= 0.85:
            status = "Critical"
        elif risk >= 0.5:
            status = "Degrading"
        elif risk >= 0.2:
            status = "Warning"
        else:
            status = "Healthy"

        health_pct = max(0, round((1 - risk) * 100))
        failure_prob = round(risk * 100, 1)

        # Get propagation mechanism from the edge that caused this
        mechanism = None
        if caused_by:
            mechanism = PROPAGATION_MECHANISMS.get((caused_by, node), f"Risk propagated from {caused_by} via mechanical coupling.")

        results.append({
            "component": node,
            "risk_score": round(risk, 3),
            "health_pct": health_pct,
            "failure_prob": failure_prob,
            "rul_hours": rul_hours,
            "status": status,
            "is_root": node == root,
            "depth": depth,
            "caused_by": caused_by,
            "propagation_mechanism": mechanism,
            "maintenance_action": COMPONENT_MAINTENANCE.get(node, "Inspect and service component."),
        })

        for neighbor, weight in adj.get(node, []):
            next_risk = risk * weight
            if next_risk >= 0.05 and neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, next_risk, depth + 1, node))

    results.sort(key=lambda x: (not x["is_root"], -x["risk_score"]))
    return results


class InjectRequest(BaseModel):
    fault_type: str
    vehicle_id: int = 1


class ResetRequest(BaseModel):
    vehicle_id: int | None = None


@router.get("/catalogue")
def get_catalogue():
    return [
        {"id": k, "label": v["label"], "icon": v["icon"], "description": v["description"]}
        for k, v in FAULT_CATALOGUE.items()
    ]


@router.post("/inject")
async def inject_fault(req: InjectRequest):
    fault = FAULT_CATALOGUE.get(req.fault_type)
    if not fault:
        raise HTTPException(status_code=400, detail=f"Unknown fault type: {req.fault_type}")

    root_subsystem = req.fault_type
    root_sensor_type = fault["root_sensor_type"]
    root_value = fault["root_sensor_value"]
    unit = SENSOR_SPECS.get(root_subsystem, {}).get(root_sensor_type, "")

    readings = []
    for v_id in range(1, 6):
        readings.append({
            "vehicle_id": v_id,
            "subsystem": root_subsystem,
            "sensor_type": root_sensor_type,
            "value": root_value,
            "unit": unit,
            "timestamp": datetime.utcnow(),
            "is_anomalous": True,
        })
    await pipeline_processor.ingest(readings)

    causal_chain = _compute_causal_chain(root_subsystem, root_risk=0.97)
    overall_health = round(
        100 - (sum(c["risk_score"] for c in causal_chain) / len(causal_chain) * 100), 1
    )

    logger.info(f"Deterministic fault injected: {req.fault_type} on Vehicle {req.vehicle_id}")

    return {
        "status": "success",
        "fault_type": req.fault_type,
        "label": fault["label"],
        "description": fault["description"],
        "vehicle_id": req.vehicle_id,
        "overall_health": overall_health,
        "affected_components": causal_chain,
        "ai_narrative": fault["ai_narrative"],
        "maintenance_summary": fault["maintenance"],
    }


@router.post("/reset")
def reset_fault(req: ResetRequest):
    db = SessionLocal()
    try:
        q = db.query(ComponentRiskState)
        if req.vehicle_id is not None:
            q = q.filter(ComponentRiskState.vehicle_id == req.vehicle_id)
        rows = q.all()
        for r in rows:
            r.risk_score = 0.0
            r.updated_at = datetime.utcnow()
        db.commit()
        
        # Clear the sliding window history so anomaly detector forgets the spike
        pipeline_processor.history.clear()
        
        logger.info(f"Fleet risk reset. Rows zeroed: {len(rows)}")
        return {"status": "reset", "rows_cleared": len(rows)}
    finally:
        db.close()
