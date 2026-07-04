import { useState, useEffect } from "react";

const STEPS = [
  "Initializing fault simulation engine...",
  "Applying fault parameters to vehicle sensor array...",
  "Running IsolationForest anomaly detection...",
  "Building causal propagation graph via Bayesian inference...",
  "Estimating Remaining Useful Life for downstream components...",
];

/**
 * AIExplainer — types out the step-by-step AI reasoning narrative.
 * Receives the `ai_narrative` array from the inject API response.
 */
export default function AIExplainer({ narrative, isSimulating, step }) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Reset when new narrative comes in
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLine("");
    setLineIndex(0);
    setCharIndex(0);
    setIsDone(false);
  }, [narrative]);

  // Typewriter effect
  useEffect(() => {
    if (!narrative || narrative.length === 0) return;
    if (isDone) return;

    const lines = narrative;
    if (lineIndex >= lines.length) {
      setIsDone(true);
      return;
    }

    const line = lines[lineIndex];
    if (charIndex < line.length) {
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + line[charIndex]);
        setCharIndex((i) => i + 1);
      }, 22);
      return () => clearTimeout(timer);
    } else {
      // Line done — push to displayed and advance
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, line]);
        setCurrentLine("");
        setCharIndex(0);
        setLineIndex((i) => i + 1);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [narrative, lineIndex, charIndex, isDone]);

  // Show simulation progress when no narrative yet
  const showProgress = isSimulating && !narrative;

  return (
    <div
      style={{
        background: "rgba(13,21,32,0.85)",
        border: "1px solid rgba(56,174,255,0.15)",
        borderRadius: 12,
        padding: "20px 24px",
        minHeight: 160,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isSimulating ? "#38AEFF" : isDone ? "#00D4A1" : "#2A3F58",
            boxShadow: isSimulating
              ? "0 0 8px #38AEFF, 0 0 16px rgba(56,174,255,0.4)"
              : isDone ? "0 0 8px #00D4A1" : "none",
            animation: isSimulating ? "led-pulse 1s ease-in-out infinite" : "none",
          }}
        />
        <span
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "#5B7A99",
            textTransform: "uppercase",
          }}
        >
          AI Reasoning Engine
        </span>
        {isDone && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontFamily: "monospace",
              color: "#00D4A1",
              letterSpacing: "0.1em",
            }}
          >
            ANALYSIS COMPLETE ✓
          </span>
        )}
      </div>

      {/* Progress steps (during simulation, before narrative) */}
      {showProgress && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.slice(0, step).map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: i === step - 1 ? 1 : 0.5,
                animation: i === step - 1 ? "fadeInUp 0.4s ease forwards" : "none",
              }}
            >
              <span style={{ color: "#38AEFF", fontFamily: "monospace", fontSize: 11 }}>
                {i === step - 1 ? "▶" : "✓"}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: i === step - 1 ? "#E2EDF8" : "#5B7A99" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Typewriter narrative */}
      {narrative && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayedLines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                opacity: 0.75,
                animation: "fadeInUp 0.3s ease forwards",
              }}
            >
              <span style={{ color: "#00D4A1", fontFamily: "monospace", fontSize: 11, marginTop: 1, flexShrink: 0 }}>✓</span>
              <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#8AACCC", lineHeight: 1.6 }}>
                {line}
              </span>
            </div>
          ))}

          {/* Current typing line */}
          {!isDone && currentLine !== undefined && lineIndex < narrative.length && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: "#38AEFF", fontFamily: "monospace", fontSize: 11, marginTop: 1, flexShrink: 0 }}>▶</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 12.5,
                  color: "#E2EDF8",
                  lineHeight: 1.6,
                }}
                className="typewriter-cursor"
              >
                {currentLine}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {!narrative && !isSimulating && (
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#2A3F58", marginTop: 8 }}>
          Inject a fault to activate AI reasoning engine...
        </p>
      )}
    </div>
  );
}
