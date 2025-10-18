// src/App.jsx — Felma UI with brand colors + rank/tier badges + sorting

import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "https://felma-backend.onrender.com";

// Brand palette
const BRAND = {
  blue: "#005E87",       // header, primary
  yellow: "#FDC732",     // tier pill bg
  berry: "#D42956",      // frustration badge bg
  lightBlue: "#2CD0D7",  // subtle focus ring/hover (optional)
  textDark: "#212121",   // main text on light
  white: "#ffffff",
  panelBg: "#0f172a",    // dark slate for header card
  panelStroke: "#0b1224",
  cardBg: "#ffffff",
  cardStroke: "#e5e7eb",
  meta: "#6b7280",
};

export default function App() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [sortKey, setSortKey] = useState("created_desc"); // created_desc | rank_desc | rank_asc

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

  const sorted = useMemo(() => {
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const withRank = items.map(it => ({
      ...it,
      _rank: toNum(it.rank ?? it.priority_rank ?? it.score),
      _created: it.created_at ? new Date(it.created_at).getTime() : 0,
    }));

    if (sortKey === "rank_desc") {
      return [...withRank].sort((a,b) => (b._rank ?? -Infinity) - (a._rank ?? -Infinity));
    }
    if (sortKey === "rank_asc") {
      return [...withRank].sort((a,b) => (a._rank ?? Infinity) - (b._rank ?? Infinity));
    }
    // created_desc (default)
    return [...withRank].sort((a,b) => (b._created) - (a._created));
  }, [items, sortKey]);

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
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
            <div style={{ flex: 1 }} />
            <div style={styles.sortWrap}>
              <label htmlFor="sort" style={styles.sortLabel}>Sort</label>
              <select
                id="sort"
                value={sortKey}
                onChange={(e)=>setSortKey(e.target.value)}
                style={styles.select}
              >
                <option value="created_desc">Newest first</option>
                <option value="rank_desc">Rank (high → low)</option>
                <option value="rank_asc">Rank (low → high)</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <div style={styles.listWrap}>
        {sorted.map((it) => (
          <NoteCard
            key={it.id ?? `${(it.content||it.transcript||"").slice(0,12)}-${it.created_at ?? Math.random()}`}
            item={it}
          />
        ))}
        {sorted.length === 0 && (
          <div style={styles.empty}>No notes yet — add one above.</div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ item }) {
  // Prefer new field; fall back to legacy fields
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

  // badges: new or legacy
  const rank = safeNumber(item.rank ?? item.priority_rank ?? item.score);
  const rawTier = (item.tier ?? item.action_tier ?? item.band ?? item.bucket ?? item.urgency ?? "").toString().trim();
  const tierEmoji = (rawTier.match(/^[^\w\s]/)?.[0]) || ""; // keep leading emoji if present
  const tierText  = rawTier.replace(/^[^\w\s]+\s*/, "");   // remove that emoji from text

  return (
    <div style={styles.noteCard}>
      <div style={styles.noteHeader}>
        <span style={styles.badgeFrustration}>{item.item_type === "idea" ? "Idea" : "Frustration"}</span>
        {rawTier && (
          <span style={styles.pillTier}>
            {tierEmoji && <span style={{marginRight:6}}>{tierEmoji}</span>}
            {tierText || rawTier}
          </span>
        )}
        {rank !== null && (
          <span style={styles.pillRank}>Rank: {rank}</span>
        )}
      </div>

      <div style={styles.headline}>{headline}</div>

      <div style={styles.meta}>
        {when} · org: {org} · team: {team}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function stripPrefix(s) {
  if (!s) return null;
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

/* ---------- styles ---------- */

const focusRing = `0 0 0 3px ${hexWithAlpha(BRAND.lightBlue, 0.4)}`;

const styles = {
  page: { maxWidth: 840, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif", color: BRAND.textDark },

  headerCard: { background: BRAND.blue, color: BRAND.white, borderRadius: 12, padding: 16, border: `1px solid ${BRAND.panelStroke}` },
  title: { margin: "4px 0 12px 0", fontSize: 22, fontWeight: 700 },

  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, color: hexWithAlpha(BRAND.white, 0.8) },

  textarea: {
    width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)", color: BRAND.white,
    padding: 10, fontSize: 15, outline: "none",
  },

  row: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },

  button: {
    background: BRAND.white, color: BRAND.blue, border: "none",
    padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700,
    boxShadow: "none",
  },

  ok: { color: "#34d399", fontSize: 14 },
  err: { color: "#fecaca", background:"#7f1d1d", padding:"2px 8px", borderRadius:6, fontSize: 13 },

  sortWrap: { display: "flex", alignItems: "center", gap: 6 },
  sortLabel: { fontSize: 12, color: hexWithAlpha(BRAND.white, 0.85) },
  select: {
    borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)", color: BRAND.white, outline: "none",
  },

  listWrap: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },

  noteCard: { background: BRAND.cardBg, border: `1px solid ${BRAND.cardStroke}`, borderRadius: 12, padding: 12 },

  noteHeader: { display: "flex", gap: 8, alignItems:"center", marginBottom: 6 },

  // Badges / pills
  badgeFrustration: {
    background: BRAND.berry, color: BRAND.white,
    borderRadius: 999, padding:"2px 8px", fontSize:12, fontWeight:700,
  },
  pillTier: {
    background: BRAND.yellow, color: BRAND.textDark,
    borderRadius: 999, padding:"2px 8px", fontSize:12, fontWeight:700,
  },
  pillRank: {
    background: "#ecfdf5", color: "#065f46",
    borderRadius: 999, padding:"2px 8px", fontSize:12, fontWeight:700,
  },

  headline: { fontSize: 15, fontWeight: 700, color: BRAND.textDark, marginBottom: 6 },
  meta: { fontSize: 12, color: BRAND.meta },
  empty: { color: BRAND.meta, fontSize: 14, padding: 12, textAlign: "center" },
};

// small utility to add alpha to hex colors
function hexWithAlpha(hex, alpha) {
  const c = hex.replace("#", "");
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
