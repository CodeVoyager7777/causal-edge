import { useEffect, useState } from "react";

function KPIBlock({ label, value, sub, color, pulse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 90, flexShrink: 0 }}>
      <span style={{
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.16em",
        color: "#3D5470",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {pulse && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: color, boxShadow: `0 0 6px ${color}`,
            flexShrink: 0, animation: "led-pulse 1.8s ease-in-out infinite",
          }} />
        )}
        <span style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: color ?? "#E2EDF8",
          lineHeight: 1,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          {value}
        </span>
      </div>
      {sub && (
        <span style={{
          fontFamily: "monospace", fontSize: 9,
          color: "#3D5470", whiteSpace: "nowrap", overflow: "hidden",
          textOverflow: "ellipsis", maxWidth: 130,
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 36, flexShrink: 0,
      background: "linear-gradient(to bottom, transparent, rgba(30,45,66,0.9), transparent)",
    }} />
  );
}

export default function CommandHeader({ connected, injectionResult, isInjecting }) {
  const [tick, setTick] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const health = injectionResult?.overall_health ?? 100;
  const affected = injectionResult?.affected_components?.length ?? 0;
  const isHealthy = !injectionResult;

  const healthColor = health >= 75 ? "#00D4A1" : health >= 50 ? "#F5A623" : "#FF3B5C";
  const stateLabel = isInjecting ? "SIMULATING" : injectionResult ? "FAULT ACTIVE" : "MONITORING";
  const stateColor = isInjecting ? "#38AEFF" : injectionResult ? "#FF3B5C" : "#00D4A1";

  // Shorten active fault label for header
  const faultLabel = injectionResult?.label ?? "None";
  const shortFaultLabel = faultLabel !== "None"
    ? faultLabel.split(" ").slice(0, 2).join(" ")
    : "—";

  return (
    <header style={{
      background: "rgba(8,14,22,0.97)",
      borderBottom: "1px solid rgba(22,35,52,0.9)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 24px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        maxWidth: 1600, margin: "0 auto",
        display: "flex", alignItems: "center",
        gap: 0, height: 66,
      }}>
        {/* Logo */}
        <div style={{ marginRight: 28, flexShrink: 0 }}>
          <div style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 15, fontWeight: 700, color: "#E2EDF8", letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}>
            CAUSAL EDGE
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: 8,
            letterSpacing: "0.18em", color: "#38AEFF", marginTop: 2, whiteSpace: "nowrap",
          }}>
            DIGITAL TWIN PLATFORM v2.0
          </div>
        </div>

        <Divider />

        {/* KPI strip — scrollable on small screens */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 20, flex: 1, padding: "0 20px",
          overflowX: "auto", overflowY: "hidden",
        }}>
          <KPIBlock
            label="Fleet Health"
            value={`${health}%`}
            sub={isHealthy ? "All systems nominal" : "Degraded"}
            color={healthColor}
            pulse={!isHealthy}
          />
          <Divider />
          <KPIBlock
            label="System State"
            value={stateLabel}
            color={stateColor}
            pulse={isInjecting || !!injectionResult}
          />
          <Divider />
          <KPIBlock
            label="Active Fault"
            value={shortFaultLabel}
            sub={injectionResult ? `Vehicle ${injectionResult.vehicle_id}` : "No fault active"}
            color={injectionResult ? "#FF3B5C" : "#3D5470"}
          />
          <Divider />
          <KPIBlock
            label="At Risk"
            value={affected > 0 ? `${affected}` : "—"}
            sub={affected > 0 ? `${affected} components` : "System healthy"}
            color={affected > 6 ? "#FF3B5C" : affected > 0 ? "#F5A623" : "#3D5470"}
          />
          <Divider />
          <KPIBlock
            label="Inference"
            value="LIVE"
            sub="Bayesian graph"
            color="#38AEFF"
            pulse
          />
        </div>

        {/* Right: status + clock */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: connected ? "rgba(0,212,161,0.07)" : "rgba(255,59,92,0.07)",
            border: `1px solid ${connected ? "rgba(0,212,161,0.18)" : "rgba(255,59,92,0.18)"}`,
            borderRadius: 20, padding: "5px 12px",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: connected ? "#00D4A1" : "#FF3B5C",
              boxShadow: connected ? "0 0 6px #00D4A1" : "0 0 6px #FF3B5C",
              animation: connected ? "led-pulse 2s ease-in-out infinite" : "none",
            }} />
            <span style={{
              fontFamily: "monospace", fontSize: 9,
              color: connected ? "#00D4A1" : "#FF3B5C", letterSpacing: "0.1em",
            }}>
              {connected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: "#3D5470", textAlign: "right",
            lineHeight: 1.5,
          }}>
            <div style={{ color: "#5B7A99" }}>
              {tick.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </div>
            <div>{tick.toLocaleTimeString("en-GB")}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
