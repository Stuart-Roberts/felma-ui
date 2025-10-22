// Minimal API client used by App.jsx
const API_BASE = import.meta.env?.VITE_API_BASE || "https://felma-backend.onrender.com";
const ORG = "stmichaels";

// GET /api/list?org=...
export async function fetchItems() {
  const r = await fetch(`${API_BASE}/api/list?org=${encodeURIComponent(ORG)}`, { cache: "no-store" });
  if (!r.ok) throw new Error("list failed");
  const json = await r.json();
  return json.items || [];
}

// GET /api/people
export async function fetchPeople() {
  const r = await fetch(`${API_BASE}/api/people`, { cache: "no-store" });
  if (!r.ok) throw new Error("people failed");
  const json = await r.json();
  return json.people || [];
}

// POST /items/new  (title + 4 factors + user_id + org_slug)
export async function createItem({ title, customer_impact, team_energy, frequency, ease, user_id }) {
  const payload = {
    title: (title || "").trim(),
    customer_impact, team_energy, frequency, ease,
    user_id,
    org_slug: ORG
  };
  const r = await fetch(`${API_BASE}/items/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(`add failed ${r.status}`);
  return await r.json();
}

// POST /items/:id/factors (4 factors) -> returns { priority_rank, action_tier, leader_to_unblock }
export async function updateFactors(id, { customer_impact, team_energy, frequency, ease }) {
  const payload = { customer_impact, team_energy, frequency, ease };
  const r = await fetch(`${API_BASE}/items/${id}/factors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(`save failed ${r.status}`);
  return await r.json();
}
