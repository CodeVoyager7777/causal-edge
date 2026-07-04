import { useState, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/live";

export function useCausalSocket() {
  const [status, setStatus] = useState('connecting');
  const [telemetry, setTelemetry] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [cascades, setCascades] = useState([]);
  const [consensus, setConsensus] = useState([]);

  const resetData = () => {
    setTelemetry({});
    setAnomalies([]);
    setCascades([]);
    setConsensus([]);
  };

  useEffect(() => {
    let ws = new WebSocket(WS_URL);
    let reconnectTimer;

    const connect = () => {
      ws.onopen = () => setStatus('connected');
      
      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          
          if (type === 'sensor_readings') {
            setTelemetry((prev) => {
              const next = { ...prev };
              data.readings.forEach(r => {
                const key = `${r.vehicle_id}-${r.subsystem}-${r.sensor_type}`;
                if (!next[key]) next[key] = [];
                // keep last 20 points for charts
                next[key] = [...next[key], r].slice(-20);
              });
              return next;
            });
          } else if (type === 'anomaly') {
            setAnomalies(prev => [data, ...prev].slice(0, 20));
          } else if (type === 'causal_propagation') {
            setCascades(prev => [data, ...prev].slice(0, 20));
          } else if (type === 'consensus_reached') {
            setConsensus(prev => [data, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("WS Parse Error:", e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        reconnectTimer = setTimeout(() => {
          ws = new WebSocket(WS_URL);
          connect();
        }, 3000);
      };
      
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  return { status, telemetry, anomalies, cascades, consensus, resetData };
}
