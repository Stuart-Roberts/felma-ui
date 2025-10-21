// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import {
  TEXT,
  COLOR_LEADER,
  COLOR_BERRY,
  formatDate,
  getViewSorted,
  isMine,
  displayOwner,
} from "./logic.js";
import ItemDetail from "./ItemDetail.jsx";

const API = import.meta.env.VITE_API_URL || "https://felma-backend.onrender.com";

function Pill({ children, muted, berry, leader, tight }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: tight ? "3px 8px" : "6px 10px",
    borderRadius: "999px",
    fontSize: tight ? 12 : 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    border: "1px solid rgba(255,255,255,0.10)",
    background: muted ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
  };
  if (berry) base.color = COLOR_BERRY;
  if (leader) {
    base.background = "rgba(44, 208, 215, 0.16)"; // #2CD0D7 with alpha
    base.border     = "1px solid rgba(44, 208, 215, 0.35)";
    base.color      = COLOR_LEADER;
  }
  return <span style={base}>{children}</span>;
}

function Card({ item, onOpen, me }) {
  const mine = isMine(item, me);
  const owner = displayOwner(item);
  return (
    <div
      onClick={() => onOpen(item)}
      style={{
        cursor: "pointer",
        background: "rgba(6,34,58,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill tight>{TEXT.chips.rank}&nbsp;{Number(item?.priority_rank || 0)}</Pill>
        {item?.action_tier && (
          <Pill tight muted>
            {TEXT.chips.tier}&nbsp;{item.action_tier}
          </Pill>
        )}
        {item?.leader_to_unblock && (
          <Pill tight leader>{TEXT.chips.leader}</Pill>
        )}
        <Pill tight muted berry={mine}>
          {TEXT.chips.originator}: {owner}
        </Pill>
      </div>

      <div style={{ fontWeight: 700, color: "#ffd666" }}>
        {item?.content || item?.transcript || "Untitled"}
      </div>

      <div style={{ opacity: 0.8, fontSize: 12 }}>
        {formatDate(item?.created_at)}
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [drawerItem, setDrawerItem] = useState(null);
  const [view, setView] = useState("rank"); // rank | newest | mine
  const [me, setMe] = useState(() => localStorage.getItem("felma.me") || "");

  async function load() {
    const res = await fetch(`${API}/api/list`);
    const json = await res.json();
    setItems(Array.isArray(json?.items) ? json.items : json);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { localStorage.setItem("felma.me", me); }, [me]);

  const shown = useMemo(() => getViewSorted(items, view, me), [items, view, me]);

  return (
    <div style={{ padding: 20, color: "white", background: "#0c304c", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ opacity: 0.6, fontWeight: 700, letterSpacing: 3 }}>DEMO</div>
          <h1 style={{ margin: "6px 0 0 0" }}>{TEXT.appLabel}</h1>
          <div style={{ color: "#ffd666", fontWeight: 600 }}>{TEXT.orgName}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ opacity: 0.75, marginRight: 4 }}>Me:</label>
          <input
            placeholder="Your name or phone (for 'Mine' view)"
            value={me}
            onChange={(e) => setMe(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              padding: "8px 10px",
              minWidth: 240,
            }}
          />
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            <option value="rank">{TEXT.views.rank}</option>
            <option value="newest">{TEXT.views.newest}</option>
            <option value="mine">{TEXT.views.mine}</option>
          </select>
          <button
            onClick={load}
            style={{
              background: "rgba(255,255,255,0.10)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {shown.map((it) => (
          <Card key={it.id} item={it} onOpen={setDrawerItem} me={me} />
        ))}
        {shown.length === 0 && (
          <div style={{ opacity: 0.7 }}>No items yet.</div>
        )}
      </div>

      {/* Drawer */}
      {drawerItem && (
        <ItemDetail
          item={drawerItem}
          me={me}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </div>
  );
}
