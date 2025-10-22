// src/logic.js
// Shared helpers for API, ranking, names, formatting

export const API =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
  "https://felma-backend.onrender.com";

// --- People mapping for the pilot ---
// Fill in any known phone numbers or emails => friendly names.
// If we don't find a match, we'll show the raw value.
export const PEOPLE = {
  // Example formats (EDIT THESE to real ones when you have them):
  // "+447822726691": "Stuart R",
  // "+447700900111": "Kate L",
  // "+447700900222": "Helen-Marie N",
  // "+447700900333": "Charlotte ?",
  // "+447700900444": "Lauren M",
  // "+447700900555": "Liz M"
  // "+447700900555": "Kate J",
};

export function displayName(idOrName) {
  if (!idOrName) return "—";
  const key = String(idOrName).trim();
  // exact match on id (phone/email)
  if (PEOPLE[key]) return PEOPLE[key];
  // also try case-insensitive name lookup in case DB stored a name in originator_name
  const lower = key.toLowerCase();
  const asName = Object.values(PEOPLE).find(
    (n) => String(n).toLowerCase() === lower
  );
  return asName || key;
}

export function saveMe(me) {
  localStorage.setItem("felma.me", me ?? "");
}

export function loadMe() {
  return localStorage.getItem("felma.me") || "";
}

export function isMine(me, ownerIdOrName) {
  if (!me || !ownerIdOrName) return false;
  const a = String(me).trim().toLowerCase();
  const b = String(ownerIdOrName).trim().toLowerCase();
  // direct match
  if (a === b) return true;
  // compare friendly names if both resolve
  const fa = displayName(me).toLowerCase();
  const fb = displayName(ownerIdOrName).toLowerCase();
  return fa && fb && fa === fb;
}

export async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return r.json();
}

export async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(`POST ${url} → ${r.status}`);
  return r.json();
}

// ---------- Ranking & rules (pilot) ----------
export function computePriorityRank(customer_impact, team_energy, frequency, ease) {
  // PR = round( (0.57*Customer + 0.43*Team) * (0.6*Frequency + 0.4*Ease) )
  const a = 0.57 * customer_impact + 0.43 * team_energy;
  const b = 0.6 * frequency + 0.4 * ease;
  return Math.round(a * b);
}

export function tierForPR(pr) {
  if (pr >= 70) return "🔥 Make it happen";
  if (pr >= 50) return "🚀 Act on it now";
  if (pr >= 36) return "🧭 Move it forward";
  if (pr >= 25) return "🙂 When time allows";
  return "⚪ Park for later";
}

// Leader to Unblock: Team Energy ≥ 9 AND Ease ≤ 3
export function shouldLeaderUnblock(team_energy, ease) {
  return Number(team_energy) >= 9 && Number(ease) <= 3;
}

// ---------- formatting ----------
export function fmtDate(d) {
  const dt = new Date(d);
  const day = dt.toLocaleString(undefined, { day: "2-digit" });
  const mon = dt.toLocaleString(undefined, { month: "short" });
  const yr = dt.toLocaleString(undefined, { year: "2-digit" });
  // "20-Oct-’25"
  return `${day}-${mon}-’${yr}`;
}
