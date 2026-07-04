import { useState, useEffect } from "react";
import { COMPONENT_META, getStatusColor, getHealthBarColor } from "../lib/faultTypes.js";

// Causal chain card with staggered entrance animation
function ComponentCard({ comp, index }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 150);
    return () => clearTimeout(t);
  }, [index]);

  const meta = COMPONENT_META[comp.component] || { label: comp.component, icon: "🔘" };
  const statusColor = getStatusColor(comp.status);
  const barColor = getHealthBarColor(comp.health_pct);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        borderColor: comp.is_root ? statusColor : "rgba(35,46,61,0.8)",
        borderWidth: comp.is_root ? 2 : 1,
        borderStyle: "solid",
        borderRadius: 10,
        background: comp.is_root ? `rgba(${statusColor === "#EF4444" ? "239,68,68" : "245,166,35"},0.07)` : "#111823",
        padding: "14px 16px",
        position: "relative",
      }}
    >
      {/* Root fault badge */}
      {comp.is_root && (
        <span style={{
          position: "absolute", top: -10, left: 12,
          background: statusColor, color: "#fff",
          fontSize: 9, fontFamily: "monospace",
          padding: "2px 8px", borderRadius: 4,
          textTransform: "uppercase", letterSpacing: 1,
        }}>Root Fault</span>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <span style={{ color: "#D6E1EC", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
            {meta.label}
          </span>
        </div>
        <span style={{
          color: statusColor,
          border: `1px solid ${statusColor}`,
          borderRadius: 4,
          fontSize: 9,
          padding: "2px 8px",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}>
          {comp.status}
        </span>
      </div>

      {/* Health bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#7C8CA0", fontSize: 10, fontFamily: "monospace" }}>Health</span>
          <span style={{ color: barColor, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>
            {comp.health_pct}%
          </span>
        </div>
        <div style={{ height: 5, background: "#1a2535", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${comp.health_pct}%`,
            background: barColor,
            borderRadius: 3,
            transition: "width 1s ease",
            boxShadow: `0 0 6px ${barColor}`,
          }} />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
        <div>
          <div style={{ color: "#7C8CA0", fontSize: 9, fontFamily: "monospace", textTransform: "uppercase" }}>Failure Prob.</div>
          <div style={{ color: statusColor, fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>
            {comp.failure_prob}%
          </div>
        </div>
        <div>
          <div style={{ color: "#7C8CA0", fontSize: 9, fontFamily: "monospace", textTransform: "uppercase" }}>RUL Estimate</div>
          <div style={{ color: "#D6E1EC", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>
            {comp.rul_hours < 24
              ? <span style={{ color: "#EF4444" }}>{comp.rul_hours}h</span>
              : `${Math.round(comp.rul_hours / 24)}d ${comp.rul_hours % 24}h`
            }
          </div>
        </div>
      </div>

      {/* Causal depth explanation */}
      {!comp.is_root && comp.depth > 0 && (
        <div style={{
          marginTop: 8,
          borderTop: "1px solid #1e2d3d",
          paddingTop: 6,
          color: "#7C8CA0",
          fontSize: 10,
          fontFamily: "monospace",
        }}>
          ↳ Cascade depth {comp.depth} — {comp.failure_prob}% chance of secondary failure
        </div>
      )}
    </div>
  );
}

export default function FaultPropagationPanel({ injectionResult, isIdle, onReset }) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    await onReset();
    setResetting(false);
  };

  // Idle state — no fault injected or currently injecting
  if (isIdle || !injectionResult) {
    return (
      <div style={{
        background: "#111823",
        border: "1px solid #232E3D",
        borderRadius: 10,
        padding: 32,
        minHeight: 480,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}>
        <div style={{ fontSize: 48, opacity: 0.4 }}>🔍</div>
        <p style={{ color: "#7C8CA0", fontFamily: "monospace", fontSize: 13, textAlign: "center", maxWidth: 280 }}>
          Select a fault type above and click <strong style={{ color: "#D6E1EC" }}>Inject Fault</strong> to simulate a failure and see how it propagates through the vehicle.
        </p>
      </div>
    );
  }

  const { affected_components, label, overall_health, vehicle_id } = injectionResult;
  const overallColor = getHealthBarColor(overall_health);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary bar */}
      <div style={{
        background: "#111823",
        border: "1px solid #232E3D",
        borderRadius: 10,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ color: "#7C8CA0", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 2 }}>
            Vehicle {vehicle_id} — Active Fault
          </div>
          <div style={{ color: "#EF4444", fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>
            {label}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#7C8CA0", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}>Overall Health</div>
            <div style={{ color: overallColor, fontSize: 22, fontFamily: "monospace", fontWeight: 700 }}>
              {overall_health}%
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#7C8CA0", fontSize: 10, fontFamily: "monospace", textTransform: "uppercase" }}>Affected</div>
            <div style={{ color: "#F5A623", fontSize: 22, fontFamily: "monospace", fontWeight: 700 }}>
              {affected_components.length}
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{
              background: "transparent",
              border: "1px solid #2DD4BF",
              color: "#2DD4BF",
              fontFamily: "monospace",
              fontSize: 11,
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 1,
              opacity: resetting ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {resetting ? "Resetting..." : "✓ Reset / Fix Fault"}
          </button>
        </div>
      </div>

      {/* Propagation cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 12,
      }}>
        {affected_components.map((comp, i) => (
          <ComponentCard key={comp.component} comp={comp} index={i} />
        ))}
      </div>
    </div>
  );
}
