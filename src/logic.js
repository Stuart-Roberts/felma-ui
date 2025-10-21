// src/logic.js
// Central helpers: ranking math, tier rules, date formatting, views, and UI text.

export const TEXT = {
  appLabel: "Felma",
  orgName: "St Michael’s",
  chips: {
    rank: "RANK",
    tier: "Tier",
    leader: "Leader to Unblock",
    originator: "Originator",
  },
  views: {
    rank: "All — rank (high → low)",
    newest: "All — newest first",
    mine: "Mine",
  },
};

// ---------- Ranking & rules ----------
export function computePriorityRank(customer_impact, team_energy, frequency, ease) {
  // PR = round( (0.57*Customer + 0.43*Team) * (0.6*Frequency + 0.4*Ease) )
  const a = 0.57 * Number(customer_impact || 0) + 0.43 * Number(team_energy || 0);
  const b = 0.6 * Number(frequency || 0) + 0.4 * Number(ease || 0);
  return Math.round(a * b);
}

export function tierForPR(pr) {
  if (pr >= 70) return "🔥 Make it happen";
  if (pr >= 50) return "🚀 Act on it now";
  if (pr >= 36) return "🧭 Move it forward";
  if (pr >= 25) return "🙂 When time allows";
  return "⚪ Park for later";
}

// Rule: Team Energy >= 9 AND Ease <= 3 → leader_to_unblock = true
export function shouldLeaderUnblock(team_energy, ease) {
  return Number(team_energy || 0) >= 9 && Number(ease || 0) <= 3;
}

// ---------- Display helpers ----------
export function isMine(row, me) {
  if (!me) return false;
  const owner = (row?.owner_name || row?.user_id || "").toString().trim().toLowerCase();
  return owner && owner.includes(me.trim().toLowerCase());
}

// “20-Oct-’25” (GB) or “Oct 20-’25” (US)
export function formatDate(iso, locale = navigator.language || "en-GB") {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = d.toLocaleString(locale, { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  const isUS = /^en-US/i.test(locale);
  return isUS ? `${mmm} ${dd}-’${yy}` : `${dd}-${mmm}-’${yy}`;
}

// Views: rank / newest / mine
export function getViewSorted(rows = [], view = "rank", me = "") {
  const items = Array.isArray(rows) ? rows.slice() : [];
  if (view === "mine") {
    return items
      .filter((r) => isMine(r, me))
      .sort((a, b) => (Number(b?.priority_rank || 0) - Number(a?.priority_rank || 0)));
  }
  if (view === "newest") {
    return items.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
  }
  // default: rank high → low
  return items.sort(
    (a, b) => Number(b?.priority_rank || 0) - Number(a?.priority_rank || 0)
  );
}
