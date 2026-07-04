import ForceGraph2D from 'react-force-graph-2d';
import { useMemo, useRef, useEffect } from 'react';

const edges = [
    ["WheelBearing", "Suspension"],
    ["Suspension", "ChassisVibration"],
    ["ChassisVibration", "Drivetrain"],
    ["WheelBearing", "Wheel"],
    ["Wheel", "TirePressure"],
    ["Drivetrain", "MotorTemp"],
    ["MotorTemp", "BatteryTemp"],
    ["Suspension", "Brake"]
];

export default function CausalRiskGraph({ cascades }) {
  const fgRef = useRef();

  const graphData = useMemo(() => {
    const nodes = new Set();
    const links = [];
    
    edges.forEach(([u, v]) => {
      nodes.add(u);
      nodes.add(v);
      links.push({ source: u, target: v });
    });

    return {
      nodes: Array.from(nodes).map(id => ({ id })),
      links
    };
  }, []);

  // When a cascade happens, emit a particle on that link
  useEffect(() => {
    if (cascades.length > 0 && fgRef.current) {
        const latest = cascades[0];
        // find link
        const link = graphData.links.find(l => l.source.id === latest.from && l.target.id === latest.to);
        if (link) {
            fgRef.current.emitParticle(link);
        }
    }
  }, [cascades, graphData.links]);

  return (
    <div className="bg-rig-panel border border-rig-border rounded shadow-panel overflow-hidden relative h-[500px] flex items-center justify-center">
        <div className="absolute top-4 left-4 z-10 text-rig-muted font-mono text-xs uppercase tracking-widest bg-rig-bg px-2 py-1 rounded">
            Causal Topology
        </div>
        <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={800}
            height={500}
            backgroundColor="#111823"
            nodeColor={() => '#7C8CA0'}
            linkColor={() => '#232E3D'}
            nodeLabel="id"
            nodeRelSize={6}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.1}
        />
    </div>
  );
}
