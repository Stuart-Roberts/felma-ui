// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchItems, fetchPeople, fmtDate, nameFor } from "./logic";
import ItemDetail from "./ItemDetail";

export default function App() {
  const [people, setPeople] = useState([]);
  const [items, setItems] = useState([]);
  const [me, setMe] = useState("+447827726691"); // you can change in the UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);  // null = new, object = edit
  const [view, setView] = useState("all-rank");

  async function refresh() {
    const [p, i] = await Promise.all([fetchPeople(), fetchItems()]);
    setPeople(p || []);
    setItems(i || []);
  }

  useEffect(() => { refresh(); }, []);

  const itemsToShow = useMemo(() => {
    if (view === "mine") return items.filter(i => i.user_id === me);
    if (view === "all-newest") {
      return [...items].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    }
    // default: all-ranked high → low
    return [...items].sort((a, b) => (b.priority_rank ?? -1) - (a.priority_rank ?? -1));
  }, [items, view, me]);

  return (
    <div className="wrap">
      <TopBar me={me} onMe={setMe} view={view} onView={setView} onNew={() => { setEditing(null); setDrawerOpen(true); }} onRefresh={refresh} />

      <div className="grid">
        {itemsToShow.map(it => (
          <Card
            key={it.id}
            it={it}
            me={me}
            originator={nameFor(it.user_id, people)}
            onOpen={() => { setEditing(it); setDrawerOpen(true); }}
          />
        ))}
        {itemsToShow.length === 0 && (
          <div className="empty">No items yet.</div>
        )}
      </div>

      <ItemDetail
        open={drawerOpen}
        item={editing}
        mePhone={me}
        people={people}
        onClose={() => setDrawerOpen(false)}
        onSaved={({ refresh: r }) => { if (r) refresh(); }}
      />
    </div>
  );
}

function TopBar({ me, onMe, view, onView, onNew, onRefresh }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="tiny">Felma</div>
        <div className="org">St Michael’s – Frideas</div>
      </div>
      <div className="spacer" />
      <label className="me">Me:&nbsp;
        <input className="me-input" value={me} onChange={e => onMe(e.target.value)} />
      </label>
      <select className="select" value={view} onChange={e => onView(e.target.value)}>
        <option value="all-rank">All — rank (high › low)</option>
        <option value="all-newest">All — newest</option>
        <option value="mine">Mine</option>
      </select>
      <button className="btn ghost" onClick={onRefresh}>Refresh</button>
      <button className="btn primary" onClick={onNew}>+ New</button>
    </div>
  );
}

function Card({ it, me, originator, onOpen }) {
  const mine = it.user_id && it.user_id === me;

  return (
    <div className="card" onClick={onOpen}>
      <div className="pills">
        <span className="pill">RANK {Number.isFinite(it.priority_rank) ? it.priority_rank : "—"}</span>
        <span className="pill">Tier {it.action_tier || "—"}</span>
        {it.leader_to_unblock ? <span className="pill cyan">Leader to Unblock</span> : null}
      </div>

      <div className="title">{it.title || "(untitled)"}</div>

      <div className="sub">
        <span className={`pill ${mine ? "berry" : "gray"}`}>{originator}</span>
      </div>

      <div className="date">{fmtDate(it.created_at)}</div>
    </div>
  );
}
