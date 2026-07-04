import random
from datetime import datetime
from app.config import SENSOR_SPECS

# Nominal baselines and std_devs for each sensor type
# format: subsystem -> sensor_type -> (mean, std_dev)
NOMINAL_VALUES = {
    "WheelBearing": {"vibration_mm_s": (2.5, 0.2), "temperature_c": (45.0, 2.0)},
    "Suspension":   {"displacement_mm": (10.0, 1.5), "load_kg": (400.0, 20.0)},
    "ChassisVibration": {"accel_g": (0.05, 0.01)},
    "Drivetrain":   {"torque_nm": (150.0, 10.0), "rpm": (2000.0, 50.0)},
    "Wheel":        {"speed_kmh": (60.0, 2.0)},
    "TirePressure": {"pressure_psi": (32.0, 0.5)},
    "MotorTemp":    {"temperature_c": (70.0, 3.0)},
    "BatteryTemp":  {"temperature_c": (35.0, 1.0)},
    "Brake":        {"pad_wear_pct": (15.0, 0.1), "temperature_c": (100.0, 15.0)},
}

def generate_sensor_value(subsystem: str, sensor_type: str) -> float:
    mean, std_dev = NOMINAL_VALUES.get(subsystem, {}).get(sensor_type, (0.0, 1.0))
    # Gaussian noise around the nominal mean
    val = random.gauss(mean, std_dev)
    return round(val, 3)

def generate_all_readings(vehicle_id: int) -> list[dict]:
    readings = []
    now = datetime.utcnow()
    for subsystem, sensors in SENSOR_SPECS.items():
        for sensor_type, unit in sensors.items():
            value = generate_sensor_value(subsystem, sensor_type)
            readings.append({
                "vehicle_id": vehicle_id,
                "subsystem": subsystem,
                "sensor_type": sensor_type,
                "value": value,
                "unit": unit,
                "timestamp": now,
                "is_anomalous": False,
            })
    return readings
