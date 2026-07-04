import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SENSOR_COLORS = {
  vibration_mm_s:  "#FF3B5C",
  temperature_c:   "#F5A623",
  displacement_mm: "#38AEFF",
  load_kg:         "#A78BFA",
  accel_g:         "#00D4A1",
  torque_nm:       "#38AEFF",
  rpm:             "#A78BFA",
  speed_kmh:       "#00D4A1",
  pressure_psi:    "#F5A623",
  pad_wear_pct:    "#FF3B5C",
};

function getSensorColor(sensorType) {
  for (const [key, color] of Object.entries(SENSOR_COLORS)) {
    if (sensorType?.includes(key.split("_")[0])) return color;
  }
  return "#00D4A1";
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(13,21,32,0.95)",
      border: "1px solid rgba(30,45,66,0.8)",
      borderRadius: 6,
      padding: "8px 12px",
      fontFamily: "monospace",
      fontSize: 11,
    }}>
      <div style={{ color: "#E2EDF8" }}>{payload[0]?.value?.toFixed(3)}</div>
    </div>
  );
};

export default function TelemetryCharts({ telemetry }) {
  const keys = Object.keys(telemetry).slice(0, 6);

  if (keys.length === 0) {
    return (
      <div style={{
        background: "rgba(13,21,32,0.7)",
        border: "1px solid rgba(30,45,66,0.8)",
        borderRadius: 16,
        padding: 32,
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#2A3F58", animation: "fadeInUp 0.5s ease" }}>
          Awaiting live telemetry from vehicle sensor array...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {keys.map(key => {
        const parts = key.split('-');
        const subsystem = parts[1] ?? key;
        const sensorType = parts[2] ?? "";
        const color = getSensorColor(sensorType);
        const data = telemetry[key] ?? [];
        const latest = data[data.length - 1]?.value;

        return (
          <div
            key={key}
            style={{
              background: "rgba(13,21,32,0.8)",
              border: "1px solid rgba(30,45,66,0.8)",
              borderRadius: 12,
              padding: "16px 16px 12px",
              height: 180,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.3s ease",
            }}
          >
            {/* Subtle glow top edge */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: 2,
              background: `linear-gradient(to right, transparent, ${color}40, transparent)`,
            }} />

            {/* Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#5B7A99", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {subsystem}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#E2EDF8", marginTop: 2 }}>
                  {sensorType}
                </div>
              </div>
              {latest !== undefined && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  color,
                  textAlign: "right",
                }}>
                  {latest.toFixed(2)}
                </div>
              )}
            </div>

            {/* Chart */}
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${sensorType}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${sensorType})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
