// felma-ui/src/App.jsx
// Complete working version with sorting/filtering and all features

import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://felma-backend.onrender.com";
const ORG_NAME = "St Michael's – Frideas";

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleDateString("en-GB", { month: "short" });
    const yr = String(d.getFullYear()).slice(-2);
    return `${day}-${mon}-'${yr}`;
  } catch {
    return "—";
  }
}

function displayName(userIdOrName) {
  if (!userIdOrName) return "—";
  const str = String(userIdOrName);
  // If it's a phone number, show last 4 digits
  if (str.startsWith("+") || str.startsWith("44")) {
    return `+${str.slice(-10)}`;
  }
  return str;
}

function isMine(meValue, itemUserId) {
  if (!meValue || !itemUserId) return false;
  const me = String(meValue).toLowerCase().trim();
  const user = String(itemUserId).toLowerCase().trim();
  return user.includes(me) || me.includes(user);
}

// Slider component
function Slider({ label, value, setValue, min = 1, max = 10 }) {
  return (
    <div className="slider-field">
      <label>
        <span>{label}</span>
        <span className="slider-value">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
      />
    </div>
  );
}

// Item Detail Drawer
function ItemDetail({ item, onClose, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [ci, setCi] = useState(item.customer_impact ?? 5);
  const [te, setTe] = useState(item.team_energy ?? 5);
  const [fr, setFr] = useState(item.frequency ?? 5);
  const [ea, setEa] = useState(item.ease ?? 5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch current values when drawer opens
    if (item.id) {
      fetch(`${API_BASE}/api/items/${item.id}/factors`)
        .then(r => r.json())
        .then(data => {
          setCi(data.customer_impact ?? 5);
          setTe(data.team_energy ?? 5);
          setFr(data.frequency ?? 5);
          setEa(data.ease ?? 5);
        })
        .catch(console.error);
    }
  }, [item.id]);

  async function saveScores() {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/items/${item.id}/factors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_impact: ci,
          team_energy: te,
          frequency: fr,
          ease: ea,
        }),
      });

      if (!response.ok) throw new Error("Save failed");
      
      setEditing(false);
      if (onSaved) onSaved();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const canSave = ci >= 1 && ci <= 10 && te >= 1 && te <= 10 && fr >= 1 && fr <= 10 && ea >= 1 && ea <= 10;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Item Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="drawer-content">
          <div className="field">
            <label>Title</label>
            <div className="title-locked">{item.title}</div>
            <small className="note">Title locked for now</small>
          </div>

          <div className="field">
            <label>Story / Idea</label>
            <div className="note">{item.transcript || "—"}</div>
          </div>

          <div className="meta-grid">
            <div>
              <div className="k">Originator</div>
              <div className="v">{displayName(item.originator_name || item.user_id)}</div>
            </div>
            <div>
              <div className="k">Tier</div>
              <div className="v">{item.action_tier || "—"}</div>
            </div>
            <div>
              <div className="k">Rank</div>
              <div className="v">{item.priority_rank ?? 0}</div>
            </div>
            <div>
              <div className="k">Leader to Unblock</div>
              <div className="v">{item.leader_to_unblock ? "Yes" : "—"}</div>
            </div>
            <div>
              <div className="k">Organisation</div>
              <div className="v">{ORG_NAME}</div>
            </div>
            <div>
              <div className="k">Created</div>
              <div className="v">{fmtDate(item.created_at)}</div>
            </div>
          </div>

          {!editing && (
            <div className="actions">
              <button className="btn-primary" onClick={() => setEditing(true)}>
                Edit scores
              </button>
            </div>
          )}

          {editing && (
            <>
              <div className="sliders-section">
                <Slider label="Customer impact" value={ci} setValue={setCi} />
                <Slider label="Team energy" value={te} setValue={setTe} />
                <Slider label="Frequency" value={fr} setValue={setFr} />
                <Slider label="Ease" value={ea} setValue={setEa} />
              </div>
              <small className="note">Set all four (1–10). Save is disabled until you do.</small>
              <div className="actions">
                <button className="btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  disabled={!canSave || saving}
                  onClick={saveScores}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filters and sorting
  const [me, setMe] = useState(localStorage.getItem("felma_me") || "");
  const [view, setView] = useState(localStorage.getItem("felma_view") || "rank");

  useEffect(() => {
    localStorage.setItem("felma_me", me);
  }, [me]);

  useEffect(() => {
    localStorage.setItem("felma_view", view);
  }, [view]);

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/list`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Load failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...items];

    // Apply "mine only" filter
    if (view === "mine") {
      result = result.filter(item => isMine(me, item.user_id || item.originator_name));
    }

    // Apply sorting
    if (view === "rank" || view === "mine") {
      // Sort by priority_rank (high to low)
      result.sort((a, b) => (b.priority_rank ?? 0) - (a.priority_rank ?? 0));
    } else if (view === "newest") {
      // Sort by created_at (newest first)
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [items, view, me]);

  function handleSaved() {
    setSelectedItem(null);
    loadItems(); // Reload to get updated values
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="title">Felma</div>
          <div className="org">{ORG_NAME}</div>
        </div>

        <div className="controls">
          <label className="control-field">
            <span>Me:</span>
            <input
              type="text"
              value={me}
              onChange={(e) => setMe(e.target.value)}
              placeholder="+447827276691"
              className="me-input"
            />
          </label>

          <select 
            value={view} 
            onChange={(e) => setView(e.target.value)}
            className="view-select"
          >
            <option value="rank">By Rank (high → low)</option>
            <option value="newest">By Date (newest first)</option>
            <option value="mine">Mine Only</option>
          </select>

          <button 
            onClick={loadItems} 
            disabled={loading}
            className="btn-refresh"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="items-grid">
        {filteredAndSorted.map(item => {
          const mine = isMine(me, item.user_id || item.originator_name);
          
          return (
            <div 
              key={item.id} 
              className="item-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="item-header">
                <div className="rank-tier">
                  <span className="rank">RANK {item.priority_rank ?? "—"}</span>
                  <span className="tier">{item.action_tier || "—"}</span>
                </div>
              </div>

              <h3 className="item-title">{item.title}</h3>

              <div className="item-footer">
                <span className={`originator-pill ${mine ? "mine" : ""}`}>
                  {displayName(item.originator_name || item.user_id)}
                </span>
                <span className="date">{fmtDate(item.created_at)}</span>
              </div>
            </div>
          );
        })}

        {!loading && filteredAndSorted.length === 0 && (
          <div className="empty-state">
            <p>No items found</p>
            {view === "mine" && <p className="note">Try entering your phone number or name in "Me"</p>}
          </div>
        )}
      </main>

      {selectedItem && (
        <ItemDetail 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
