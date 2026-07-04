import { useState, useEffect } from "react";
import { STATUS_META } from "../lib/faultTypes.js";

function formatRUL(hours) {
  if (hours === 0) return "FAILURE IMMINENT";
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function HealthBar({ pct, color }) {
  return (
    <div style={{ position: "relative", background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

/**
 * NodeInspector — shows detailed information for a clicked node.
 */
export default function NodeInspector({ node, faultLabel }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (node) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [node?.component]);

  if (!node) {
    return (
      <div
        style={{
          background: "rgba(13,21,32,0.6)",
          border: "1px dashed rgba(30,45,66,0.8)",
          borderRadius: 12,
          padding: 24,
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 24, opacity: 0.3 }}>👆</span>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#2A3F58", textAlign: "center" }}>
          Click any node in the graph to inspect its health, RUL, and causal reasoning.
        </p>
      </div>
    );
  }

  const meta = STATUS_META[node.status] ?? STATUS_META.Healthy;
  const humanName = node.component.replace(/([A-Z])/g, " $1").trim();

  return (
    <div
      style={{
        background: "rgba(13,21,32,0.9)",
        border: `1px solid ${meta.color}40`,
        borderRadius: 12,
        padding: 24,
        boxShadow: `0 0 0 1px ${meta.color}20, 0 20px 40px -12px rgba(0,0,0,0.5)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#E2EDF8",
              letterSpacing: "0.03em",
            }}
          >
            {humanName}
          </div>
          {node.is_root && (
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#FF3B5C", letterSpacing: "0.15em", marginTop: 2 }}>
              ⚡ ROOT CAUSE — {faultLabel}
            </div>
          )}
          {!node.is_root && node.caused_by && (
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#5B7A99", marginTop: 2 }}>
              Caused by: <span style={{ color: "#38AEFF" }}>{node.caused_by.replace(/([A-Z])/g, " $1").trim()}</span>
            </div>
          )}
        </div>
        <span
          style={{
            background: meta.bg,
            border: `1px solid ${meta.color}50`,
            color: meta.color,
            borderRadius: 20,
            padding: "4px 12px",
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 10,
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {meta.label}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Health", value: `${node.health_pct}%`, color: meta.color },
          { label: "Failure Prob.", value: `${node.failure_prob}%`, color: node.failure_prob > 70 ? "#FF3B5C" : node.failure_prob > 30 ? "#F5A623" : "#00D4A1" },
          { label: "RUL", value: formatRUL(node.rul_hours), color: node.rul_hours < 50 ? "#FF3B5C" : "#E2EDF8" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#5B7A99", letterSpacing: "0.12em", marginBottom: 4 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color, fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Health bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5B7A99", letterSpacing: "0.1em" }}>COMPONENT HEALTH</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: meta.color }}>{node.health_pct}%</span>
        </div>
        <HealthBar pct={node.health_pct} color={meta.color} />
      </div>

      {/* Propagation mechanism */}
      {node.propagation_mechanism && (
        <div
          style={{
            background: "rgba(56,174,255,0.05)",
            border: "1px solid rgba(56,174,255,0.1)",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#38AEFF", letterSpacing: "0.15em", marginBottom: 6 }}>
            ⟶ PROPAGATION MECHANISM
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8AACCC", lineHeight: 1.65, margin: 0 }}>
            {node.propagation_mechanism}
          </p>
        </div>
      )}

      {/* Maintenance action */}
      {node.maintenance_action && (
        <div
          style={{
            background: "rgba(0,212,161,0.05)",
            border: "1px solid rgba(0,212,161,0.1)",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#00D4A1", letterSpacing: "0.15em", marginBottom: 6 }}>
            🔧 MAINTENANCE RECOMMENDATION
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8AACCC", lineHeight: 1.65, margin: 0 }}>
            {node.maintenance_action}
          </p>
        </div>
      )}
    </div>
  );
}
