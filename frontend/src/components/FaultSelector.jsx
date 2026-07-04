import { useState, useEffect } from "react";
import { FAULT_TYPES } from "../lib/faultTypes.js";

function GlowCard({ selected, fault, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${fault.glowColor}, rgba(13,21,32,0.9))`
          : "rgba(13,21,32,0.6)",
        border: selected
          ? `1px solid ${fault.color}60`
          : "1px solid rgba(30,45,66,0.8)",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.25s ease",
        boxShadow: selected
          ? `0 0 0 1px ${fault.color}30, 0 8px 24px ${fault.glowColor}`
          : "none",
        transform: selected ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{fault.icon}</span>
        <span
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 13,
            fontWeight: selected ? 600 : 400,
            color: selected ? fault.color : "#E2EDF8",
            letterSpacing: "0.03em",
            transition: "color 0.25s",
          }}
        >
          {fault.label}
        </span>
        {selected && (
          <span
            style={{
              marginLeft: "auto",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: fault.color,
              boxShadow: `0 0 8px ${fault.color}`,
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <p style={{ fontFamily: "monospace", fontSize: 10.5, color: "#5B7A99", margin: 0, lineHeight: 1.5 }}>
        {fault.shortDesc}
      </p>
    </button>
  );
}

const STEP_LABELS = [
  "Initializing...",
  "Applying fault to sensor array...",
  "Running anomaly detection...",
  "Building causal graph...",
  "Predicting downstream failures...",
];

/**
 * FaultSelector — card-based fault selection with animated inject progress.
 */
export default function FaultSelector({
  selectedFault,
  onSelect,
  onInject,
  onReset,
  isInjecting,
  hasResult,
  step,
}) {
  const selected = FAULT_TYPES.find((f) => f.id === selectedFault);

  return (
    <div>
      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(30,45,66,0.8)" }} />
        <span
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "#5B7A99",
            textTransform: "uppercase",
          }}
        >
          FAULT INJECTION CENTRE
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(30,45,66,0.8)" }} />
      </div>

      {/* Fault cards */}
      {!hasResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {FAULT_TYPES.map((f) => (
            <GlowCard
              key={f.id}
              fault={f}
              selected={selectedFault === f.id}
              onClick={() => !isInjecting && !hasResult && onSelect(f.id)}
            />
          ))}
        </div>
      )}

      {/* Active fault summary (post-inject) */}
      {hasResult && selected && (
        <div
          style={{
            background: `linear-gradient(135deg, ${selected.glowColor}, rgba(13,21,32,0.9))`,
            border: `1px solid ${selected.color}50`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 28 }}>{selected.icon}</span>
          <div>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 15, color: selected.color, fontWeight: 600, marginBottom: 4 }}>
              {selected.label}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8AACCC" }}>
              {selected.shortDesc}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: selected.color,
              boxShadow: `0 0 12px ${selected.color}, 0 0 24px ${selected.glowColor}`,
              animation: "led-pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
        </div>
      )}

      {/* Progress steps */}
      {isInjecting && (
        <div
          style={{
            background: "rgba(13,21,32,0.6)",
            border: "1px solid rgba(56,174,255,0.15)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: i < step ? 1 : 0.25,
                transition: "opacity 0.4s ease",
                animation: i === step - 1 ? "fadeInUp 0.3s ease" : "none",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: i < step ? "#38AEFF" : "#1E2D42",
                  boxShadow: i === step - 1 ? "0 0 8px #38AEFF" : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "monospace", fontSize: 11, color: i < step ? "#8AACCC" : "#2A3F58" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {!hasResult ? (
          <button
            onClick={onInject}
            disabled={isInjecting}
            style={{
              flex: 1,
              background: isInjecting
                ? "rgba(255,59,92,0.3)"
                : "linear-gradient(135deg, #FF3B5C, #CC1F3A)",
              border: "none",
              borderRadius: 10,
              padding: "14px 0",
              color: "#fff",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.12em",
              cursor: isInjecting ? "not-allowed" : "pointer",
              boxShadow: isInjecting ? "none" : "0 0 20px rgba(255,59,92,0.3), 0 4px 12px rgba(0,0,0,0.4)",
              transition: "all 0.25s ease",
            }}
          >
            {isInjecting ? "SIMULATING..." : "⚡ INJECT FAULT"}
          </button>
        ) : (
          <button
            onClick={onReset}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, rgba(0,212,161,0.15), rgba(0,212,161,0.05))",
              border: "1px solid rgba(0,212,161,0.3)",
              borderRadius: 10,
              padding: "14px 0",
              color: "#00D4A1",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.12em",
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(0,212,161,0.15)",
              transition: "all 0.25s ease",
            }}
          >
            ✓ RESET / FIX FAULT
          </button>
        )}
      </div>
    </div>
  );
}
