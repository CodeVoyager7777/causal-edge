const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getHealth() {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error("Backend offline");
  return res.json();
}

export async function injectFault(faultType, vehicleId = 1) {
  const res = await fetch(`${BASE}/api/fault/inject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fault_type: faultType, vehicle_id: vehicleId }),
  });
  if (!res.ok) throw new Error("Failed to inject fault");
  return res.json();
}

export async function resetFault(vehicleId = null) {
  const res = await fetch(`${BASE}/api/fault/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicle_id: vehicleId }),
  });
  if (!res.ok) throw new Error("Failed to reset fault");
  return res.json();
}

