// src/App.jsx — Felma UI with transcript/content fallbacks + rank/tier badges

import { useEffect, useState } from "react";

const BACKEND_URL = "https://felma-backend.onrender.com";

export default function App() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setError(""); setOk("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/list`);
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Could not load notes: " + e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setOk("");
    const content = (inputValue || "").trim();
    if (!content) { setError("Please type a note before saving."); return; }

    const payload = { content, item_type: "frustration", user_id: null };

    try {
      setSaving(true);
      const res = await fetch(`${BACKEND_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = await res.text();
        try { msg = JSON.parse(msg).error || msg; } catch {}
        throw new Error(msg || `Save failed (${res.status})`);
      }
      const created = await res.json();
      setItems(prev => [created, ...prev]);
      setInputValue("");
      setOk("Saved ✔︎");
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Felma — Open Notes</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>New</label>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a quick note…"
            rows={3}
            style={styles.textarea}
          />
          <div style={styles.row}>
            <button type="submit" disabled={saving} style={styles.button}>
              {saving ? "Saving…" : "Save"}
            </button>
            {ok && <span style={styles.ok}>{ok}</span>}
            {error && <span style={styles.err}>✕ {error}</span>}
          </div>
        </form>
      </div>

      <div style={styles.listWrap}>
        {items.map((it) => (
          <NoteCard
            key={it.id ?? `${(it.content||it.transcript||"").slice(0,12)}-${it.created_at ?? Math.random()}`}
            item={it}
          />
        ))}
        {items.length === 0 && (
          <div style={styles.empty}>No notes yet — add one above.</div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ item }) {
  // Prefer new field; fall back to legacy fields so old notes always show
  const text =
    item.content ??
    stripPrefix(item.transcript) ??
    item.message ?? item.text ?? item.title ??
    item.description ?? item.details ?? item.orig_text ?? item.sms_text ??
    "(untitled)";

  const headline = firstSentence(text);
  const when = formatWhen(item.created_at);
  const org = item.org_id ?? item.org_slug ?? "—";
  const team = item.team_id ?? "—";

  // badges: use new rank/tier, else legacy priority_rank/action_tier
  const rank = safeNumber(item.rank ?? item.priority_rank ?? item.score);
  const tier = item.tier ?? item.action_tier ?? item.band ?? item.bucket ?? item.urgency ?? null;

  return (
    <div style={styles.noteCard}>
      <div style={styles.noteHeader}>
        <span style={styles.badge}>{item.item_type === "idea" ? "Idea" : "Frustration"}</span>
        {tier && <span style={{...styles.pill, background:"#eef2ff", color:"#3730a3"}}>{tier}</span>}
        {rank !== null && <span style={{...styles.pill, background:"#ecfdf5", color:"#065f46"}}>Rank: {rank}</span>}
      </div>

      <div style={styles.headline}>{headline}</div>

      <div style={styles.meta}>
        {when} · org: {org} · team: {team}
      </div>
    </div>
  );
}

function stripPrefix(s) {
  if (!s) return null;
  // Some legacy rows start with "Frustration: ..." — remove that label
  return String(s).replace(/^(Frustration|Idea)\s*:\s*/i, "").trim();
}

function firstSentence(text) {
  if (!text) return "(untitled)";
  const t = String(text).trim();
  const m = t.match(/[.!?]\s/);
  const end = m ? m.index + 1 : t.length;
  return t.slice(0, end).trim() || "(untitled)";
}

function formatWhen(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return String(iso); }
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const styles = {
  page: { maxWidth: 840, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" },
  card: { background: "#111827", color:"#fff", borderRadius: 12, padding: 16 },
  title: { margin: "4px 0 12px 0", fontSize: 22, fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, color: "#d1d5db" },
  textarea: { width: "100%", borderRadius: 8, border: "1px solid #374151", background:"#1f2937", color:"#fff", padding: 10, fontSize: 15, outline: "none" },
  row: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },
  button: { background: "#10b981", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer" },
  ok: { color: "#34d399", fontSize: 14 },
  err: { color: "#fecaca", background:"#7f1d1d", padding:"2px 8px", borderRadius:6, fontSize: 13 },
  listWrap: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  noteCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 },
  noteHeader: { display: "flex", gap: 8, alignItems:"center", marginBottom: 6 },
  badge: { background:"#fee2e2", color:"#991b1b", borderRadius: 999, padding:"2px 8px", fontSize:12, fontWeight:600 },
  pill: { borderRadius: 999, padding:"2px 8px", fontSize:12, fontWeight:600 },
  headline: { fontSize: 15, fontWeight: 600, marginBottom: 6 },
  meta: { fontSize: 12, color: "#6b7280" },
  empty: { color: "#6b7280", fontSize: 14, padding: 12, textAlign: "center" },
};
