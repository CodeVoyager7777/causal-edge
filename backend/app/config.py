"""
Central configuration for the Causal-Graph Edge AI Fleet system.
All tunable constants live here so modules never hardcode magic numbers.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- Database ---
DB_PATH = os.path.join(BASE_DIR, "fleet.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# --- Fleet ---
FLEET_SIZE = 5
VEHICLE_NAMES = [f"Vehicle-{str(i+1).zfill(2)}" for i in range(FLEET_SIZE)]

# --- Simulation ---
BASE_TICK_SECONDS = 0.5          # default sensor sampling interval per vehicle
MIN_TICK_SECONDS = 0.1           # fastest allowed (high-risk) sampling interval
MAX_TICK_SECONDS = 1.0           # slowest allowed (idle/low-risk) sampling interval

# --- Sensors simulated per vehicle (subsystem -> sensor_type -> unit) ---
SENSOR_SPECS = {
    "WheelBearing": {"vibration_mm_s": "mm/s", "temperature_c": "C"},
    "Suspension":   {"displacement_mm": "mm", "load_kg": "kg"},
    "ChassisVibration": {"accel_g": "g"},
    "Drivetrain":   {"torque_nm": "Nm", "rpm": "rpm"},
    "Wheel":        {"speed_kmh": "km/h"},
    "TirePressure": {"pressure_psi": "psi"},
    "MotorTemp":    {"temperature_c": "C"},
    "BatteryTemp":  {"temperature_c": "C"},
    "Brake":        {"pad_wear_pct": "%", "temperature_c": "C"},
}

# --- Anomaly Detection ---
ANOMALY_SCORE_THRESHOLD = 0.62   # normalized 0-1 risk score above which a reading is flagged
ISOFOREST_CONTAMINATION = 0.05
ISOFOREST_WINDOW = 60            # rolling window of readings used to (re)fit the model per sensor

# --- Causal Graph (component topology, propagation weight per edge) ---
CAUSAL_EDGES = [
    ("WheelBearing", "Suspension", 0.85),
    ("Suspension", "ChassisVibration", 0.70),
    ("ChassisVibration", "Drivetrain", 0.55),
    ("WheelBearing", "Wheel", 0.60),
    ("Wheel", "TirePressure", 0.50),
    ("Drivetrain", "MotorTemp", 0.65),
    ("MotorTemp", "BatteryTemp", 0.45),
    ("Suspension", "Brake", 0.40),
]
RISK_DECAY_FLOOR = 0.05          # propagation stops below this risk value
RISK_HALF_LIFE_SECONDS = 20.0    # component risk naturally decays over time

# --- Adaptive Sampling ---
RISK_HIGH_WATERMARK = 0.6        # risk above this -> fastest sampling
RISK_LOW_WATERMARK = 0.15        # risk below this -> slowest sampling

# --- Fleet Consensus ---
CONSENSUS_QUORUM_RATIO = 0.1     # fraction of fleet that must agree to confirm a fault pattern
CONSENSUS_WINDOW_SECONDS = 0.5   # time window in which votes are collected for a round
CONSENSUS_MIN_VOTES = 1          # minimum votes required regardless of fleet size

# --- Maintenance Ledger ---
LEDGER_GENESIS_HASH = "0" * 64
HMAC_SECRET_KEY = b"causaledge-demo-signing-key"  # demo-only signing key, not for production

# --- WebSocket ---
WS_BROADCAST_INTERVAL_SECONDS = 0.25  # min interval between broadcast flushes
