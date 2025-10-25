// src/App.jsx - COMPLETE FILE
import { useEffect, useMemo, useState } from "react";
import ItemDetail from "./ItemDetail.jsx";
import { API, formatShortDate, tierForPR, shouldLeaderUnblock, displayName, isMine, loadMe, saveMe } from "./logic";
import "./App.css";

const ORG_NAME = "St Michael's – Frideas";

function AddForm({ me, onClose, onCreated }) {
  const [content, setContent] = useState("");
  const [ci, setCi] = useState(0);  // ← START AT 0
  const [te, setTe] = useState(0);  // ← START AT 0
  const [fr, setFr] = useState(0);  // ← START AT 0
  const [ez, setEz] = useState(0);  // ← START AT 0
  const [busy, setBusy] = useState(false);

  // Can only save if ALL sliders are 1-10 (not 0) AND content exists
  const ready = content.trim().length > 0 && 
                [ci, te, fr, ez].every(n => n >= 1 && n <= 10);

  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const body = {
        user_id: me || null,
        originator_name: me || null,
        content: content.trim(),
        customer_impact: ci,
        team_energy: te,
        frequency: fr,
        ease: ez,
      };
      const r = await fetch(`${API}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(errText || "Save failed");
      }
      const row = await r.json();
      onCreated(row);
      onClose();
    } catch (e) {
      alert(`Add failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const Slider = ({ label, value, setValue }) => (
    <div className="field">
      <label>
        {label} <b>{value === 0 ? "—" : value}</b>
      </label>
      <input
        type="range"
        min="0"  // ← Allow 0 so user MUST set it
        max="10"
        step="1"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="ticks">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );

  return (
    <div className="modal">
      <div className="panel">
        <div className="panel-head">
          <div className="title">New item</div>
          <button className="x" onClick={onClose}>×</button>
        </div>

        <label className="lbl">Headline</label>
        <input
          className="txt"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's happening?"
        />

        <div className="rating-section">
          <div className="rating-label">Rate this item (1–10)</div>
          <Slider label="Customer impact" value={ci} setValue={setCi} />
          <Slider label="Team energy" value={te} setValue={setTe} />
          <Slider label="Frequency" value={fr} setValue={setFr} />
          <Slider label="Ease" value={ez} setValue={setEz} />
        </div>

        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button 
            className="primary" 
            disabled={!ready || busy} 
            onClick={save}
            title={!ready ? "Please rate all factors (1-10) and add a headline" : ""}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("ranked");
  const [me, setMe] = useState(() => loadMe());
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/list`, { credentials: "omit" });
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

  function onChangeMe(val) {
    setMe(val);
    saveMe(val);
  }

  const sorted = useMemo(() => {
    let arr = [...items];

    // Filter if "mine"
    if (view === "mine" && me) {
      arr = arr.filter(it => isMine(me, it.user_id || it.originator_name));
    }

    // Sort
    if (view === "newest") {
      arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
      // ranked (default)
      arr.sort((a, b) => {
        const ra = Number(a.rank ?? a.priority_rank ?? 0);
        const rb = Number(b.rank ?? b.priority_rank ?? 0);
        if (rb !== ra) return rb - ra;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    }

    return arr;
  }, [items, view, me]);

  return (
    <div className="page">
      <header className="bar">
        <div className="left">
          <div className="demo">DEMO</div>
          <div className="app">Felma</div>
          <div className="org">{ORG_NAME}</div>
        </div>

        <div className="controls">
          <div className="who">
            <div className="label">You:</div>
            <input
              className="whoinp"
              placeholder="Your name"
              value={me}
              onChange={e => onChangeMe(e.target.value)}
            />
          </div>

          <select className="view" value={view} onChange={(e) => setView(e.target.value)}>
            <option value="ranked">By Rank (high → low)</option>
            <option value="newest">Newest first</option>
            <option value="mine" disabled={!me}>Mine only</option>
          </select>

          <button className="btn" onClick={() => setAdding(true)}>+ New Item</button>
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </header>

      <main className="grid">
        {loading ? (
          <div style={{ color: "#9FB3C8", padding: 20 }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div style={{ color: "#9FB3C8", padding: 20 }}>No items yet.</div>
        ) : (
          sorted.map((it) => {
            const mine = me && isMine(me, it.user_id || it.originator_name);
            const showLeader = it.leader_to_unblock || shouldLeaderUnblock(it.team_energy, it.ease);
            const rank = Number(it.rank ?? it.priority_rank ?? 0);
            const tier = it.action_tier || tierForPR(rank);

            return (
              <div key={it.id} className="card" onClick={() => setOpen(it)}>
                <div className="pills">
                  <span className="pill rank">RANK {rank}</span>
                  <span className="pill tier">{tier}</span>
                  {showLeader && <span className="pill leader">Leader to Unblock</span>}
                  <span className={mine ? "pill owner berry" : "pill owner"}>
                    {displayName(it.originator_name || it.user_id)}
                  </span>
                </div>
                <div className="title">{it.content || it.transcript || "Untitled"}</div>
                <div className="date">{formatShortDate(it.created_at)}</div>
              </div>
            );
          })
        )}
      </main>

      {open && <ItemDetail item={open} me={me} onClose={() => setOpen(null)} onUpdated={load} />}
      {adding && <AddForm me={me} onClose={() => setAdding(false)} onCreated={(row) => { setItems([row, ...items]); setAdding(false); }} />}
    </div>
  );
}
