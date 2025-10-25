// felma-ui/src/App.jsx
// Complete version with all fixes

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
  
  if (str.includes(" ")) {
    const parts = str.split(" ");
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
  }
  
  if (str.startsWith("+") || /^\d+$/.test(str)) {
    return `+${str.slice(-4)}`;
  }
  
  return str;
}

function isMine(currentUserPhone, item) {
  if (!currentUserPhone) return false;
  const myPhone = String(currentUserPhone).replace(/\s+/g, "");
  
  if (item.user_id) {
    const itemPhone = String(item.user_id).replace(/\s+/g, "");
    if (itemPhone === myPhone) return true;
  }
  
  return false;
}

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

function ItemDetail({ item, onClose, onSaved, currentUserPhone }) {
  const [editing, setEditing] = useState(false);
  const [ci, setCi] = useState(item.customer_impact ?? 5);
  const [te, setTe] = useState(item.team_energy ?? 5);
  const [fr, setFr] = useState(item.frequency ?? 5);
  const [ea, setEa] = useState(item.ease ?? 5);
  const [title, setTitle] = useState(item.title || "");
  const [saving, setSaving] = useState(false);
  
  const canEditTitle = isMine(currentUserPhone, item);

  useEffect(() => {
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
      // Save title if it changed and user can edit
      if (canEditTitle && title !== item.title) {
        const titleResponse = await fetch(`${API_BASE}/api/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
        if (!titleResponse.ok) console.error("Failed to save title");
      }

      // Save scores
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
            {canEditTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
                placeholder="Enter title..."
              />
            ) : (
              <>
                <div className="title-locked">{item.title}</div>
                <small className="note">Only the originator can edit the title</small>
              </>
            )}
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
              <div className="v">{item.leader_to_unblock ? "Yes" : "No"}</div>
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

function NewItemModal({ onClose, onSaved, currentUser }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!currentUser) {
      alert("Please select your name first");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/items/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          transcript: title.trim(),
          user_id: currentUser.phone,
          originator_name: currentUser.full_name,
          org_slug: "stmichaels",
        }),
      });

      if (!response.ok) throw new Error("Failed to create item");
      
      onSaved();
      onClose();
    } catch (e) {
      alert(`Failed to create item: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer new-item-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>New Item</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-content">
          <div className="field">
            <label>What's the idea or frustration?</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type your idea or frustration here..."
              className="new-item-textarea"
              rows={4}
              autoFocus
            />
          </div>

          <div className="actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!title.trim() || saving}
            >
              {saving ? "Creating..." : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserSelector({ profiles, onSelect, onClose }) {
  const [selected, setSelected] = useState("");

  function handleSelect() {
    const user = profiles.find(p => p.id === selected);
    if (user) {
      onSelect(user);
      onClose();
    }
  }

  return (
    <div className="drawer-overlay">
      <div className="drawer user-selector-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Who are you?</h2>
        </div>

        <div className="drawer-content">
          <div className="field">
            <label>Select your name</label>
            <select 
              value={selected} 
              onChange={(e) => setSelected(e.target.value)}
              className="user-select"
              autoFocus
            >
              <option value="">-- Choose your name --</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="actions">
            <button 
              className="btn-primary btn-large" 
              disabled={!selected}
              onClick={handleSelect}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("felma_user");
    return stored ? JSON.parse(stored) : null;
  });
  
  const [view, setView] = useState(localStorage.getItem("felma_view") || "rank");

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("felma_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("felma_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("felma_view", view);
  }, [view]);

  async function loadProfiles() {
    try {
      const response = await fetch(`${API_BASE}/api/profiles`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (e) {
      console.error("Failed to load profiles:", e);
    }
  }

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
    loadProfiles();
    loadItems();
  }, []);

  useEffect(() => {
    if (!currentUser && profiles.length > 0) {
      setShowUserSelector(true);
    }
  }, [currentUser, profiles]);

  const filteredAndSorted = useMemo(() => {
    let result = [...items];

    if (view === "mine" && currentUser) {
      result = result.filter(item => isMine(currentUser.phone, item));
    }

    if (view === "rank" || view === "mine") {
      result.sort((a, b) => (b.priority_rank ?? 0) - (a.priority_rank ?? 0));
    } else if (view === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [items, view, currentUser]);

  function handleSaved() {
    setSelectedItem(null);
    setShowNewItem(false);
    loadItems();
  }

  function handleUserChange() {
    setShowUserSelector(true);
  }

  function handleUserSelect(user) {
    setCurrentUser(user);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="title">Felma</div>
          <div className="org">{ORG_NAME}</div>
        </div>

        <div className="controls">
          <div className="current-user-display">
            <span className="user-label">You:</span>
            <button 
              className="user-name-btn"
              onClick={handleUserChange}
              title="Change user"
            >
              {currentUser ? currentUser.display_name : "Not selected"}
            </button>
          </div>

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
            onClick={() => setShowNewItem(true)}
            className="btn-new"
            disabled={!currentUser}
            title={!currentUser ? "Select your name first" : "Create new item"}
          >
            + New Item
          </button>

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
          const mine = currentUser ? isMine(currentUser.phone, item) : false;
          
          return (
            <div 
              key={item.id} 
              className="item-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="item-header">
                <div className="rank-tier">
                  <span className="rank">{item.priority_rank ?? "—"} rank</span>
                  <span className="tier">{item.action_tier || "—"}</span>
                </div>
                {item.leader_to_unblock && (
                  <span className="leader-badge">🔓 Leader</span>
                )}
              </div>

              <h3 className="item-title">{item.title}</h3>

              <div className="item-footer">
                <span className={`originator-pill ${mine ? "mine" : ""}`}>
                  {mine && currentUser ? currentUser.display_name : displayName(item.originator_name || item.user_id)}
                </span>
                <span className="date">{fmtDate(item.created_at)}</span>
              </div>
            </div>
          );
        })}

        {!loading && filteredAndSorted.length === 0 && (
          <div className="empty-state">
            <p>No items found</p>
            {view === "mine" && (
              <p className="note">You haven't created any items yet</p>
            )}
          </div>
        )}
      </main>

      {selectedItem && (
        <ItemDetail 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onSaved={handleSaved}
          currentUserPhone={currentUser?.phone}
        />
      )}

      {showNewItem && (
        <NewItemModal
          onClose={() => setShowNewItem(false)}
          onSaved={handleSaved}
          currentUser={currentUser}
        />
      )}

      {showUserSelector && (
        <UserSelector
          profiles={profiles}
          onSelect={handleUserSelect}
          onClose={() => setShowUserSelector(false)}
        />
      )}
    </div>
  );
}
