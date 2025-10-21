import React, { useEffect, useMemo, useState } from "react";
import ItemDetail from "./ItemDetail.jsx";
import { COPY, ORG_NAME } from "./copy.js";

// Backend URL (Render env VITE_BACKEND_URL overrides; else fallback)
const BACKEND =
  import.meta?.env?.VITE_BACKEND_URL || "https://felma-backend.onrender.com";

// Optional mapping for legacy user identifiers -> display names
const DISPLAY_NAME = {
  "+447000000000": "Charlotte",
  "+447111111111": "Liz",
  "+447222222222": "Helen-Marie",
  "+447333333333": "Lauren",
  "+4474827276691": "Kate"
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B233C",
    color: "#D6E2F0",
    fontFamily:
      'Aptos, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
  },
  shell: { maxWidth: 1180, margin: "0 auto", padding: "28px 20px 56px" },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  brandLeft: { display: "flex", flexDirection: "column", gap: 6 },
  demo: { letterSpacing: 2, color: "#9FB3C8", fontWeight: 700 },
  appTitle: { fontSize: 20, fontWeight: 700 },
  org: { fontSize: 12, color: "#9FB3C8" },
  controls: { display: "flex", alignItems: "center", gap: 10 },
  btn: {
    background: "#0F2E4F",
    color: "#D6E2F0",
    border: "1px solid #264868",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  card: {
    background: "#132B45",
    border: "1px solid #254967",
    borderRadius: 16,
    padding: 14,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  pill: {
    background: "#0F2E4F",
    border: "1px solid #2D5577",
    color: "#BFD2E3",
    borderRadius: 12,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 600,
  },
  title: {
    color: "#F4D35E", // yellow headline
    fontWeight: 700,
    margin: "2px 0 8px",
  },
  small: { fontSize: 12, color: "#9FB3C8" },

  drawerScrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  drawer: {
    width: 420,
    maxWidth: "90vw",
    height: "100%",
    background: "#0F2338",
    borderLeft: "1px solid #254967",
    padding: 16,
    overflowY: "auto",
  },

  modalScrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
  },
  modal: {
    width: 560,
    maxWidth: "92vw",
    background: "#0F2338",
    border: "1px solid #254967",
    borderRadius: 16,
    padding: 18,
  },
  input: {
    width: "100%",
    background: "#0E1E33",
    color: "#D6E2F0",
    border: "1px solid #2A4D6E",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  label: { display: "block", fontSize: 12, color: "#9FB3C8", margin: "6px 0" },
  row: { display: "flex", gap: 10, alignItems: "center" },
};

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = mons[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${day}-${mon}-’${yy}`;
}

function displayOwner(item) {
  return item?.owner_name || DISPLAY_NAME[item?.user_id] || "";
}

function tierLabel(item) {
  if (item?.tier && typeof item.tier === "string" && item.tier.trim()) return item.tier;
  const r = Number(item?.rank ?? item?.priority_rank ?? 0);
  if (r >= 50) return "🚀 Move now";
  if (r >= 25) return "📈 Move it forward";
  return "⏳ WHEN TIME ALLOWS";
}

// Weighted 0–100 score from four 1–10 sliders
function computeRank({ customer_impact, team_energy, frequency, ease }) {
  const ci = Number(customer_impact || 0);
  const te = Number(team_energy || 0);
  const fr = Number(frequency || 0);
  const ea = Number(ease || 0);
  // Weights: Impact 35%, Energy 30%, Frequency 20%, Ease 15%
  const weighted = ci * 0.35 + te * 0.30 + fr * 0.20 + ea * 0.15; // 1..10
  return Math.round(weighted * 10); // 10..100
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/list`, { credentials: "omit" });
      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      console.error("list failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ra = Number(a?.rank ?? a?.priority_rank ?? 0);
      const rb = Number(b?.rank ?? b?.priority_rank ?? 0);
      if (rb !== ra) return rb - ra;
      return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
    });
  }, [items]);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.top}>
          <div style={styles.brandLeft}>
            <div style={styles.demo}>{COPY.app.demo}</div>
            <div style={styles.appTitle}>{COPY.app.title}</div>
            <div style={styles.org}>{ORG_NAME}</div>
          </div>
          <div style={styles.controls}>
            <button style={styles.btn} onClick={() => setAdding(true)}>{COPY.app.new}</button>
            <button style={styles.btn} onClick={load}>{COPY.app.refresh}</button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#9FB3C8" }}>{COPY.app.loading}</div>
        ) : sorted.length === 0 ? (
          <div style={{ color: "#9FB3C8" }}>{COPY.app.empty}</div>
        ) : (
          <div style={styles.grid}>
            {sorted.map((it) => (
              <div key={it.id} style={styles.card} onClick={() => setDetail(it)}>
                <div style={styles.badgeRow}>
                  <span style={styles.pill}>{COPY.badges.rank} {Number(it?.rank ?? it?.priority_rank ?? 0)}</span>
                  <span style={styles.pill}>{COPY.badges.tier} {tierLabel(it)}</span>
                  {it?.leader_to_unblock ? (
                    <span style={styles.pill}>{COPY.badges.leader}</span>
                  ) : null}
                  {displayOwner(it) ? <span style={styles.pill}>{displayOwner(it)}</span> : null}
                </div>
                <div style={styles.title}>{it?.content || it?.item_title || "Untitled"}</div>
                <div style={styles.small}>{fmtDate(it?.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div style={styles.drawerScrim} onClick={() => setDetail(null)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <ItemDetail
              item={detail}
              onClose={() => setDetail(null)}
              displayOwner={displayOwner}
              fmtDate={fmtDate}
              tierLabel={tierLabel}
              org={ORG_NAME}
            />
          </div>
        </div>
      )}

      {adding && <AddModal onClose={() => setAdding(false)} onAdded={load} />}
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9FB3C8" }}>
        <span>{label}</span>
        <span style={{ color: "#F4D35E", fontWeight: 700 }}>{value || "—"}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value || 1}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9FB3C8" }}>
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdded }) {
  const [content, setContent] = useState("");
  const [owner_name, setOwnerName] = useState("");
  const [leader_to_unblock, setLeader] = useState(false);

  const [customer_impact, setCI] = useState(0);
  const [team_energy, setTE] = useState(0);
  const [frequency, setFR] = useState(0);
  const [ease, setEA] = useState(0);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canSave =
    content.trim() &&
    customer_impact > 0 &&
    team_energy > 0 &&
    frequency > 0 &&
    ease > 0;

  const save = async () => {
    setErr("");
    if (!canSave) {
      setErr(COPY.add.needAll);
      return;
    }
    const rank = computeRank({ customer_impact, team_energy, frequency, ease });
    try {
      setSaving(true);
      const res = await fetch(`${BACKEND}/api/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          owner_name: owner_name.trim() || null,
          leader_to_unblock,
          item_type: "frustration",
          customer_impact,
          team_energy,
          frequency,
          ease,
          rank
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      await res.json();
      onClose();
      onAdded?.();
    } catch (e) {
      console.error(e);
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalScrim} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px", color: "#F4D35E" }}>{COPY.add.title}</h3>

        <label style={styles.label}>{COPY.add.fieldTitle}</label>
        <input
          style={styles.input}
          placeholder={COPY.add.fieldTitlePlaceholder}
          value={content}
          maxLength={160}
          onChange={(e) => setContent(e.target.value)}
        />

        <div style={{ height: 6 }} />

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>{COPY.add.owner}</label>
            <input
              style={styles.input}
              placeholder={COPY.add.ownerPlaceholder}
              value={owner_name}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input
              type="checkbox"
              checked={leader_to_unblock}
              onChange={(e) => setLeader(e.target.checked)}
            />
            {COPY.add.leader}
          </label>
        </div>

        <div style={{ height: 8 }} />

        <Slider label={COPY.add.customerImpact} value={customer_impact} onChange={setCI} />
        <Slider label={COPY.add.teamEnergy} value={team_energy} onChange={setTE} />
        <Slider label={COPY.add.frequency} value={frequency} onChange={setFR} />
        <Slider label={COPY.add.ease} value={ease} onChange={setEA} />

        {err ? <div style={{ color: "#FFB3B3", marginTop: 10 }}>{err}</div> : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={styles.btn} onClick={onClose} disabled={saving}>{COPY.add.cancel}</button>
          <button style={styles.btn} onClick={save} disabled={saving || !canSave}>
            {saving ? "Saving…" : COPY.add.save}
          </button>
        </div>
      </div>
    </div>
  );
}
