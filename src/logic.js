// src/logic.js
export const API = import.meta.env.VITE_API_BASE || "https://felma-backend.onrender.com";

async function j(url, opts) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(`${opts?.method || "GET"} ${url} → ${r.status}`);
  return r.json();
}

export async function fetchPeople() {
  const { people } = await j(`${API}/api/people`);
  return people || [];
}

export async function fetchItems() {
  const { items } = await j(`${API}/api/list`);
  return items || [];
}

export async function createItem({ story, user_phone, customer_impact, team_energy, frequency, ease }) {
  return j(`${API}/items/new`, {
    method: "POST",
    body: JSON.stringify({ story, user_phone, customer_impact, team_energy, frequency, ease }),
  });
}

export async function saveFactors(id, { customer_impact, team_energy, frequency, ease, title }) {
  return j(`${API}/items/${id}/factors`, {
    method: "POST",
    body: JSON.stringify({ customer_impact, team_energy, frequency, ease, title }),
  });
}

export function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  } catch { return ""; }
}

export function nameFor(userPhone, people) {
  if (!userPhone) return "—";
  const p = people.find(p => (p.phone || "").trim() === (userPhone || "").trim());
  return p?.display_name || userPhone;
}
