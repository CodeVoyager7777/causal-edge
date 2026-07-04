import { useState, useEffect, useRef, useCallback } from "react";
import { STATUS_META } from "../lib/faultTypes.js";

const NODE_R = 48;          // Larger nodes — more room for text
const NODE_V_GAP = 180;     // More vertical room between rows
const NODE_H_GAP = 200;     // More horizontal room between siblings
const PADDING_X = 80;
const PADDING_TOP = 80;     // Extra room for ROOT badge above first node
const PADDING_BOTTOM = 48;

function statusColor(status) {
  return STATUS_META[status]?.color ?? "#5B7A99";
}

// Split a CamelCase component name into up to 2 short lines
function splitLabel(name) {
  const words = name.replace(/([A-Z])/g, " $1").trim().split(" ");
  if (words.length === 1) return [words[0], ""];
  // Try to balance: first line = first word(s), second line = rest
  // If first word ≤ 7 chars and second word exists, put them on 2 lines
  return [words.slice(0, 1).join(""), words.slice(1).join(" ")];
}

function buildPositions(components) {
  const byDepth = {};
  for (const c of components) {
    (byDepth[c.depth] = byDepth[c.depth] || []).push(c);
  }

  const maxNodesPerRow = Math.max(...Object.values(byDepth).map((arr) => arr.length));
  const svgWidth = Math.max(640, maxNodesPerRow * NODE_H_GAP + PADDING_X * 2);
  const maxDepth = Math.max(...components.map((c) => c.depth));
  const svgHeight = (maxDepth + 1) * NODE_V_GAP + PADDING_TOP + PADDING_BOTTOM;

  const positions = {};
  for (const [depthStr, nodes] of Object.entries(byDepth)) {
    const depth = parseInt(depthStr);
    const y = PADDING_TOP + depth * NODE_V_GAP;
    const totalW = (nodes.length - 1) * NODE_H_GAP;
    const startX = svgWidth / 2 - totalW / 2;
    nodes.forEach((n, i) => {
      positions[n.component] = { x: startX + i * NODE_H_GAP, y };
    });
  }

  return { positions, svgWidth, svgHeight };
}

function buildEdges(components, positions) {
  const edges = [];
  for (const c of components) {
    if (c.caused_by && positions[c.caused_by] && positions[c.component]) {
      edges.push({
        from: c.caused_by,
        to: c.component,
        toStatus: c.status,
      });
    }
  }
  return edges;
}

function CurvedEdge({ x1, y1, x2, y2, color, animDelay, visible }) {
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  return (
    <g style={{ opacity: visible ? 1 : 0, transition: `opacity 0.6s ${animDelay}s` }}>
      {/* Background track */}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
      {/* Animated flow */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.65}
        strokeDasharray="8 6"
        style={{ animation: visible ? `flow 1.4s linear infinite ${animDelay}s` : "none" }}
      />
      {/* Wide glow */}
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeOpacity={0.06} />
    </g>
  );
}

function NodeCircle({ comp, pos, visible, animDelay, isSelected, onClick }) {
  const color = statusColor(comp.status);
  const circumference = 2 * Math.PI * (NODE_R - 6);
  const dashLen = (comp.health_pct / 100) * circumference;
  const isRoot = comp.is_root;
  const [line1, line2] = splitLabel(comp.component);

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? `translate(${pos.x}px, ${pos.y}px) scale(1)`
          : `translate(${pos.x}px, ${pos.y}px) scale(0.3)`,
        transition: `opacity 0.5s ${animDelay}s, transform 0.6s ${animDelay}s cubic-bezier(0.34,1.56,0.64,1)`,
        cursor: "pointer",
      }}
      onClick={() => onClick(comp)}
    >
      {/* Pulse rings — only root & critical */}
      {isRoot && (
        <>
          <circle r={NODE_R + 18} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.25}
            style={{ animation: "ring-pulse 2.2s ease-out infinite" }} />
          <circle r={NODE_R + 8} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.35}
            style={{ animation: "ring-pulse 2.2s ease-out 0.6s infinite" }} />
        </>
      )}

      {/* Ambient glow fill */}
      <circle r={NODE_R + 10} fill={color} fillOpacity={isRoot ? 0.1 : 0.05} />

      {/* Main ring */}
      <circle
        r={NODE_R}
        fill={isRoot ? "rgba(255,59,92,0.12)" : "rgba(10,18,28,0.96)"}
        stroke={isSelected ? "#38AEFF" : color}
        strokeWidth={isSelected ? 2.5 : isRoot ? 2 : 1.5}
      />

      {/* Health arc — slightly inside the main ring */}
      <circle
        r={NODE_R - 6}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={`${dashLen} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90)"
        strokeOpacity={0.75}
      />

      {/* ROOT label badge — sits above the node */}
      {isRoot && (
        <>
          <rect x={-20} y={-NODE_R - 22} width={40} height={16} rx={8}
            fill="rgba(255,59,92,0.18)" stroke="rgba(255,59,92,0.45)" strokeWidth={1} />
          <text x={0} y={-NODE_R - 10} textAnchor="middle" fontSize={8}
            fontFamily="'Chakra Petch', sans-serif" letterSpacing={1.5} fill="#FF3B5C" fontWeight={700}>
            ROOT
          </text>
        </>
      )}

      {/* Component name — 2 lines, centred in node */}
      {line2 ? (
        <>
          <text x={0} y={-5} textAnchor="middle" fontSize={10}
            fontFamily="'Chakra Petch', sans-serif" fontWeight={600} fill={color} letterSpacing={0.3}>
            {line1}
          </text>
          <text x={0} y={9} textAnchor="middle" fontSize={9}
            fontFamily="'Chakra Petch', sans-serif" fill={color} letterSpacing={0.3} fillOpacity={0.85}>
            {line2}
          </text>
        </>
      ) : (
        <text x={0} y={4} textAnchor="middle" fontSize={10}
          fontFamily="'Chakra Petch', sans-serif" fontWeight={600} fill={color} letterSpacing={0.3}>
          {line1}
        </text>
      )}

      {/* Health % — below the circle, clear of the ring */}
      <text x={0} y={NODE_R + 18} textAnchor="middle" fontSize={10}
        fontFamily="'JetBrains Mono', monospace" fill={color} fontWeight={600}>
        {comp.health_pct}%
      </text>
    </g>
  );
}

/**
 * CausalChainViz — Animated SVG causal propagation tree.
 * Edge labels removed from SVG to eliminate clutter;
 * propagation mechanism is shown in the NodeInspector on click.
 */
export default function CausalChainViz({ injectionResult, onNodeSelect, selectedNode }) {
  const [visibleDepths, setVisibleDepths] = useState(new Set());
  const timerRefs = useRef([]);

  const components = injectionResult?.affected_components ?? [];
  const { positions, svgWidth, svgHeight } = buildPositions(
    components.length ? components : [{ depth: 0 }]
  );
  const edges = buildEdges(components, positions);
  const maxDepth = Math.max(0, ...components.map((c) => c.depth));

  // Animate nodes depth-by-depth
  useEffect(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setVisibleDepths(new Set());

    if (!components.length) return;

    for (let d = 0; d <= maxDepth; d++) {
      const t = setTimeout(() => {
        setVisibleDepths((prev) => new Set([...prev, d]));
      }, d * 420 + 200);
      timerRefs.current.push(t);
    }

    return () => timerRefs.current.forEach(clearTimeout);
  }, [injectionResult]);

  const handleNodeClick = useCallback(
    (comp) => { onNodeSelect?.(comp === selectedNode ? null : comp); },
    [onNodeSelect, selectedNode]
  );

  if (!injectionResult) {
    return (
      <div style={{
        background: "rgba(13,21,32,0.7)",
        border: "1px solid rgba(30,45,66,0.8)",
        borderRadius: 16,
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="scan-line" />
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          border: "2px solid rgba(56,174,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>
          🔍
        </div>
        <p style={{
          fontFamily: "monospace", fontSize: 12, color: "#2A3F58",
          textAlign: "center", maxWidth: 280, lineHeight: 1.7,
        }}>
          No active simulation.
          <br />
          Select a fault and click{" "}
          <span style={{ color: "#FF3B5C" }}>⚡ Inject Fault</span> to start.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto", borderRadius: 12 }}>
      {/* Hint */}
      <p style={{
        fontFamily: "monospace", fontSize: 10.5, color: "#2A3F58",
        textAlign: "center", marginBottom: 8, letterSpacing: "0.05em",
      }}>
        Click any node to inspect its causal mechanism &amp; maintenance recommendation
      </p>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", minWidth: 360, display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(56,174,255,0.06)" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#dot-grid)" />

        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions[e.from];
          const to = positions[e.to];
          if (!from || !to) return null;
          const color = statusColor(e.toStatus);
          const fromDepth = components.find((c) => c.component === e.from)?.depth ?? 0;
          const toDepth = components.find((c) => c.component === e.to)?.depth ?? 0;
          const visible = visibleDepths.has(fromDepth) && visibleDepths.has(toDepth);
          return (
            <CurvedEdge
              key={i}
              x1={from.x} y1={from.y + NODE_R}
              x2={to.x}   y2={to.y - NODE_R}
              color={color}
              animDelay={toDepth * 0.18}
              visible={visible}
            />
          );
        })}

        {/* Nodes */}
        {components.map((comp) => {
          const pos = positions[comp.component];
          if (!pos) return null;
          const visible = visibleDepths.has(comp.depth);
          return (
            <NodeCircle
              key={comp.component}
              comp={comp}
              pos={pos}
              visible={visible}
              animDelay={comp.depth * 0.28}
              isSelected={selectedNode?.component === comp.component}
              onClick={handleNodeClick}
            />
          );
        })}
      </svg>
    </div>
  );
}
