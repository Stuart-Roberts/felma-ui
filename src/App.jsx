import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

// Change if you’ve set VITE_API_BASE; otherwise use your Render URL:
const API =
  import.meta.env?.VITE_API_BASE || "https://felma-backend.onrender.com";

// ---------- helpers ----------
const displayTitle = (it) =>
  (it.title && it.title.trim()) ||
  (it.content && it.content.trim()) ||
  (it.transcript && it.transcript.trim()) ||
  "(untitled)";

const fmtDate = (iso) =>
  !iso ? "" : new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

const Pill = ({ children, tone = "default" }) => {
  const cls =
    tone === "rank"
      ? "pill pill-rank"
      : tone === "tier"
      ? "pill pill-tier"
      : tone === "leader"
      ? "pill pill-leader"
      : tone === "originator-me"
      ? "pill pill-me"
      : "pill";
  return <span className={cls}>{children}</span>;
};

export default function App() {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [me, setMe] = useState("+447827276691"); // your number prefilled
  const [view, setView] = useState("rank"); // "rank" | "newest" | "mine"
  const [drawer, setDrawer] = useState(null); // {mode:'view'|'new', item:{}}

  // people map
  const nameOf = (user_id) => {
    if (!user_id) return "—";
    const p =
      people.find((p) => p.phone === user_id) ||
      people.find((p) => p.email === user_id);
    return p?.display_name || String(user_id);
  };

  // fetchers
  const fetchPeople = async () => {
    const r = await fetch(`${API}/api/people`);
    const j = await r.json();
    setPeople(j.people || []);
  };
  const fetchItems = async () => {
    const r = await fetch(`${API}/api/list`);
    const j = await r.json();
    setItems(j.items || []);
  };

  useEffect(() => {
    fetchPeople();
    fetchItems();
  }, []);

  const shown = useMemo(() => {
    let arr = [...items];
    if (view === "mine") {
      arr = arr.filter((it) => it.user_id && me && String(it.user_id) === String(me));
      arr.sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));
    } else if (view === "newest") {
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      // rank high→low
      arr.sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));
    }
    return arr;
  }, [items, view, me]);

  // save factors
  const saveFactors = async (id, body) => {
    const r = await fetch(`${API}/items/${id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Save failed (${r.status})`);
    const j = await r.json();
    // refresh the list so rank/tier update
    await fetchItems();
    return j;
  };

  // create new
  const addNew = async (payload) => {
    const r = await fetch(`${API}/items/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Add failed (${r.status})`);
    const j = await r.json();
    await fetchItems();
    return j;
  };

  return (
    <div className="wrap">
      <header className="bar">
        <div>
          <div className="tiny">Felma</div>
          <div className="org">St Michael’s – Frideas</div>
        </div>
        <div className="controls">
          <label className="me">
            <span>Me:</span>
            <input
              value={me}
              onChange={(e) => setMe(e.target.value)}
              placeholder="+44… or email"
            />
          </label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            aria-label="View"
          >
            <option value="rank">All — rank (high → low)</option>
            <option value="newest">All — newest</option>
            <option value="mine">Mine</option>
          </select>
          <button onClick={fetchItems}>Refresh</button>
          <button
            className="primary"
            onClick={() =>
              setDrawer({
                mode: "new",
                item: {
                  title: "",
                  customer_impact: 5,
                  team_energy: 5,
                  frequency: 5,
                  ease: 5,
                },
              })
            }
          >
            + New
          </button>
        </div>
      </header>

      <main className="grid">
        {shown.map((it) => {
          const origin = nameOf(it.user_id);
          const isMe = it.user_id && me && String(it.user_id) === String(me);
          return (
            <article
              key={it.id}
              className="card"
              onClick={() => setDrawer({ mode: "view", item: it })}
            >
              <div className="row">
                <Pill tone="rank">RANK {it.priority_rank || 0}</Pill>
                <Pill tone="tier">Tier {it.action_tier || "—"}</Pill>
                {it.leader_to_unblock ? (
                  <Pill tone="leader">Leader to Unblock</Pill>
                ) : null}
              </div>

              <h3 className="title">{displayTitle(it)}</h3>

              <div className="row meta">
                <Pill tone={isMe ? "originator-me" : "default"}>
                  Originator: {origin}
                </Pill>
              </div>

              <div className="date">{fmtDate(it.created_at)}</div>
            </article>
          );
        })}
        {shown.length === 0 && (
          <div className="empty">No items yet.</div>
        )}
      </main>

      {drawer && (
        <Drawer
          mode={drawer.mode}
          item={drawer.item}
          me={me}
          onClose={() => setDrawer(null)}
          onSaveFactors={async (vals) => {
            await saveFactors(drawer.item.id, vals);
            setDrawer(null);
          }}
          onAddNew={async (vals) => {
            await addNew(vals);
            setDrawer(null);
          }}
        />
      )}
    </div>
  );
}

// ---------- Drawer (view/edit & new) ----------
function Slider({ label, value, onChange, min = 1, max = 10 }) {
  return (
    <label className="slider">
      <span>{label} {value}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Drawer({ mode, item, me, onClose, onSaveFactors, onAddNew }) {
  const [story, setStory] = useState(item.title || "");
  const [ci, setCi] = useState(item.customer_impact ?? 5);
  const [te, setTe] = useState(item.team_energy ?? 5);
  const [fq, setFq] = useState(item.frequency ?? 5);
  const [ez, setEz] = useState(item.ease ?? 5);
  const canSave = ci && te && fq && ez;

  const doSave = async () => {
    if (!canSave) return;
    await onSaveFactors({
      customer_impact: ci,
      team_energy: te,
      frequency: fq,
      ease: ez,
    });
  };

  const doAdd = async () => {
    if (!canSave) return;
    await onAddNew({
      user_id: me,
      title: story,
      customer_impact: ci,
      team_energy: te,
      frequency: fq,
      ease: ez,
    });
  };

  return (
    <div className="drawer">
      <div className="panel">
        <div className="panel-head">
          <strong>{mode === "new" ? "New item" : "Edit item"}</strong>
          <button className="link" onClick={onClose}>×</button>
        </div>

        <label className="field">
          <span>Story / title</span>
          <textarea
            rows={3}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Add a short story or title…"
            disabled={mode !== "new"}
          />
        </label>

        <Slider label="Customer impact" value={ci} onChange={setCi} />
        <Slider label="Team energy" value={te} onChange={setTe} />
        <Slider label="Frequency" value={fq} onChange={setFq} />
        <Slider label="Ease" value={ez} onChange={setEz} />

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          {mode === "new" ? (
            <button className="primary" disabled={!canSave} onClick={doAdd}>
              Save
            </button>
          ) : (
            <button className="primary" disabled={!canSave} onClick={doSave}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
