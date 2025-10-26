// src/logic.js - COMPLETE FILE
export const API = "https://felma-backend.onrender.com";

// Priority rank formula (agreed)
export function computePriorityRank(customer_impact, team_energy, frequency, ease) {
  const ci = Number(customer_impact) || 0;
  const te = Number(team_energy) || 0;
  const fr = Number(frequency) || 0;
  const ea = Number(ease) || 0;
  
  const a = 0.57 * ci + 0.43 * te;
  const b = 0.6 * fr + 0.4 * ea;
  return Math.round(a * b);
}

// Tier labels with emojis - FIXED to always return string with emoji
export function tierForPR(pr) {
  const rank = Number(pr) || 0;
  
  if (rank >= 70) return "🔥 Make it happen";
  if (rank >= 50) return "🚀 Act on it now";
  if (rank >= 36) return "🧭 Move it forward";
  if (rank >= 25) return "🙂 When time allows";
  return "⚪ Park for later";
}

// Leader to unblock rule (agreed)
export function shouldLeaderUnblock(team_energy, ease) {
  const te = Number(team_energy) || 0;
  const ez = Number(ease) || 0;
  // Rule: Team Energy >= 9 AND Ease <= 3
  return te >= 9 && ez <= 3;
}

// Format date helper
export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

// Display name helper
export function displayName(userId) {
  const DISPLAY_NAME = {
    "+4474827276691": "Stuart R",
    "Stuart R": "Stuart R",
  };
  return DISPLAY_NAME[userId] || userId || "—";
}

// Check if item is mine
export function isMine(me, userId) {
  if (!me || !userId) return false;
  return me === userId || displayName(me) === displayName(userId);
}

// Local storage helpers for "me"
export function loadMe() {
  try {
    return localStorage.getItem("felma_me") || "";
  } catch {
    return "";
  }
}

export function saveMe(value) {
  try {
    localStorage.setItem("felma_me", value || "");
  } catch {}
}

// Helper for GET requests
export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Helper for POST requests
export async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
}

// Format date for detail view
export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
