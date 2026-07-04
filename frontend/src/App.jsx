import { useState, useRef } from "react";
import { useCausalSocket } from "./lib/socket.js";
import { injectFault, resetFault } from "./lib/api.js";
import { FAULT_TYPES } from "./lib/faultTypes.js";

import CommandHeader from "./components/CommandHeader.jsx";
import FaultSelector from "./components/FaultSelector.jsx";
import CausalChainViz from "./components/CausalChainViz.jsx";
import NodeInspector from "./components/NodeInspector.jsx";
import AIExplainer from "./components/AIExplainer.jsx";
import TelemetryCharts from "./components/TelemetryCharts.jsx";
import ConsensusFeed from "./components/ConsensusFeed.jsx";

// ─── Reusable section heading ─────────────────────────────
function SectionHeading({ title, subtitle, accent = "#E2EDF8" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: accent,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        margin: 0,
        marginBottom: 4,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: "monospace",
          fontSize: 10.5,
          color: "#3D5470",
          margin: 0,
          lineHeight: 1.55,
          maxWidth: 560,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Glass panel ─────────────────────────────────────────
function Panel({ children, style }) {
  return (
    <div style={{
      background: "rgba(10,17,28,0.75)",
      border: "1px solid rgba(22,35,52,0.9)",
      borderRadius: 14,
      padding: 24,
      boxShadow: "0 16px 40px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Offline banner ───────────────────────────────────────
function OfflineBanner() {
  return (
    <div style={{
      background: "rgba(255,59,92,0.06)",
      border: "1px solid rgba(255,59,92,0.2)",
      borderRadius: 10,
      padding: "12px 18px",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <span style={{ color: "#FF3B5C", fontSize: 14, flexShrink: 0 }}>⚠</span>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#FF3B5C", lineHeight: 1.5 }}>
        Backend offline — restart with:{" "}
        <code style={{
          background: "rgba(255,59,92,0.1)",
          padding: "1px 7px",
          borderRadius: 4,
          fontSize: 10,
        }}>
          cd backend &amp;&amp; python run.py
        </code>
      </span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const { status, telemetry, consensus, resetData } = useCausalSocket();
  const connected = status === "connected";

  const [selectedFault, setSelectedFault] = useState(FAULT_TYPES[0].id);
  const [isInjecting, setIsInjecting]   = useState(false);
  const [injectionResult, setInjectionResult] = useState(null);
  const [step, setStep]                 = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const handleInject = async () => {
    clearTimers();
    setIsInjecting(true);
    setInjectionResult(null);
    setSelectedNode(null);
    setStep(1);

    [2, 3, 4, 5].forEach((s, i) => {
      const t = setTimeout(() => setStep(s), (i + 1) * 200);
      timers.current.push(t);
    });

    try {
      const res = await injectFault(selectedFault, 1);
      const t = setTimeout(() => {
        setInjectionResult(res);
        setIsInjecting(false);
        setStep(0);
      }, 1000);
      timers.current.push(t);
    } catch (e) {
      console.error("Inject failed:", e);
      setIsInjecting(false);
      setStep(0);
    }
  };

  const handleReset = async () => {
    try {
      await resetFault();
      resetData();
      setInjectionResult(null);
      setSelectedNode(null);
      setStep(0);
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };

  return (
    <div className="hero-gradient grid-overlay" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <CommandHeader
        connected={connected}
        injectionResult={injectionResult}
        isInjecting={isInjecting}
      />

      <main style={{
        flex: 1,
        padding: "28px 28px 48px",
        maxWidth: 1600,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {!connected && <OfflineBanner />}

        {/* ── Two-column layout: 320px sidebar | flexible main ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 20,
          alignItems: "start",
        }}>

          {/* ────────── LEFT SIDEBAR ────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

            {/* Fault Injection */}
            <Panel>
              <FaultSelector
                selectedFault={selectedFault}
                onSelect={setSelectedFault}
                onInject={handleInject}
                onReset={handleReset}
                isInjecting={isInjecting}
                hasResult={!!injectionResult}
                step={step}
              />
            </Panel>

            {/* Component Inspector */}
            <div>
              <SectionHeading
                title="Component Inspector"
                subtitle="Click any node in the graph to inspect it."
                accent="#38AEFF"
              />
              <NodeInspector node={selectedNode} faultLabel={injectionResult?.label} />
            </div>

            {/* Fleet Ledger */}
            <div>
              <SectionHeading
                title="Fleet Quorum Ledger"
                subtitle="Confirmed faults hashed and committed by the fleet."
                accent="#A78BFA"
              />
              <ConsensusFeed consensus={consensus} />
            </div>
          </div>

          {/* ────────── RIGHT MAIN AREA ────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

            {/* Causal Propagation Graph */}
            <div>
              <SectionHeading
                title="Causal Propagation Graph"
                subtitle="AI-computed fault cascade. Nodes appear sequentially as failures propagate."
                accent="#FF3B5C"
              />
              <Panel>
                <CausalChainViz
                  injectionResult={injectionResult}
                  selectedNode={selectedNode}
                  onNodeSelect={setSelectedNode}
                />
              </Panel>
            </div>

            {/* AI Reasoning Engine */}
            <div>
              <SectionHeading
                title="AI Reasoning Engine"
                subtitle="Explainable AI — step-by-step narrative generated by the Bayesian inference model."
                accent="#38AEFF"
              />
              <AIExplainer
                narrative={injectionResult?.ai_narrative}
                isSimulating={isInjecting}
                step={step}
              />
            </div>

            {/* Maintenance Summary */}
            {injectionResult?.maintenance_summary && (
              <Panel style={{
                background: "rgba(0,212,161,0.04)",
                border: "1px solid rgba(0,212,161,0.12)",
                padding: "18px 22px",
                animation: "fadeInUp 0.5s ease forwards",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>🔧</span>
                  <span style={{
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "#00D4A1",
                    textTransform: "uppercase",
                  }}>
                    Recommended Maintenance Action
                  </span>
                </div>
                <p style={{
                  fontFamily: "monospace",
                  fontSize: 12.5,
                  color: "#8AACCC",
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {injectionResult.maintenance_summary}
                </p>
              </Panel>
            )}

            {/* Telemetry Charts */}
            <div>
              <SectionHeading
                title="Real-Time Sensor Feeds"
                subtitle="Live telemetry from the vehicle sensor array via WebSocket."
                accent="#00D4A1"
              />
              <TelemetryCharts telemetry={telemetry} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
