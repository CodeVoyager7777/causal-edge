// Fault type metadata — single source of truth for UI + backend alignment
export const FAULT_TYPES = [
  {
    id: "WheelBearing",
    label: "Wheel Bearing Failure",
    icon: "⚙️",
    severity: "critical",
    shortDesc: "Spalling detected on inner race. Vibration at 45 mm/s.",
    color: "#FF3B5C",
    glowColor: "rgba(255,59,92,0.25)",
  },
  {
    id: "BatteryTemp",
    label: "Battery Thermal Runaway",
    icon: "🔋",
    severity: "critical",
    shortDesc: "Cell temp 98°C — 63°C above safe limit. Venting risk.",
    color: "#FF3B5C",
    glowColor: "rgba(255,59,92,0.25)",
  },
  {
    id: "Brake",
    label: "Brake System Failure",
    icon: "🛑",
    severity: "critical",
    shortDesc: "Pad wear at 97%. Metal-on-metal contact detected.",
    color: "#FF3B5C",
    glowColor: "rgba(255,59,92,0.25)",
  },
  {
    id: "Suspension",
    label: "Suspension Collapse",
    icon: "🔩",
    severity: "warning",
    shortDesc: "Displacement at 88 mm — spring fracture signature.",
    color: "#F5A623",
    glowColor: "rgba(245,166,35,0.25)",
  },
  {
    id: "MotorTemp",
    label: "Motor Overheating",
    icon: "🌡️",
    severity: "warning",
    shortDesc: "Winding temp 185°C — Class H insulation limit exceeded.",
    color: "#F5A623",
    glowColor: "rgba(245,166,35,0.25)",
  },
];

export const STATUS_META = {
  Critical:  { color: "#FF3B5C", bg: "rgba(255,59,92,0.12)",  ring: "#FF3B5C", label: "CRITICAL"  },
  Degrading: { color: "#F5A623", bg: "rgba(245,166,35,0.10)", ring: "#F5A623", label: "DEGRADING" },
  Warning:   { color: "#F5A623", bg: "rgba(245,166,35,0.07)", ring: "#F5A623", label: "WARNING"   },
  Healthy:   { color: "#00D4A1", bg: "rgba(0,212,161,0.08)",  ring: "#00D4A1", label: "HEALTHY"   },
};
