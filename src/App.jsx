import "./App.css";
import { useEffect, useState } from "react";
import { API, fetchJSON, createItem } from "./logic";
import ItemDetail from "./ItemDetail";

// Organization definitions
const ORGANIZATIONS = [
  { id: "ST_MICHAELS", name: "St Michael's – Frideas" },
  { id: "G_PROJECT", name: "G Project - Frustrations → Ideas" },
  { id: "DEV_ONLY", name: "Dev Testing - Frustrations → Ideas" },
  { id: "DOOR_CONTROLS", name: "Door Controls - Frustrations → Ideas" },
  { id: "PILOT_2", name: "Pilot 2 - Frustrations → Ideas" },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState("");
  const [sort, setSort] = useState("date");
  const [filter, setFilter] = useState("all");
  const [openItem, setOpenItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [ci, setCi] = useState(0);
  const [te, setTe] = useState(0);
  const [fr, setFr] = useState(0);
  const [ea, setEa] = useState(0);
  
  // Organization state - default to ST_MICHAELS
  const [selectedOrg, setSelectedOrg] = useState(() => {
    try {
      return localStorage.getItem("felma_org") || "ST_MICHAELS";
    } catch {
      return "ST_MICHAELS";
    }
  });

  useEffect(() => { loadItems(); }, []);
  
  // Save selected org to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("felma_org", selectedOrg);
    } catch {}
  }, [selectedOrg]);

  async function loadItems() {
    try {
      const data = await fetchJSON(`${API}/list`);
      setItems(data.items || []);
    } catch (e) {
      console.error("load failed:", e);
    }
  }

  async function handleUpdated() {
    try {
      const data = await fetchJSON(`${API}/list`);
      setItems(data.items || []);
      if (openItem) {
        const updated = (data.items || []).find(i => i.id === openItem.id);
        if (updated) setOpenItem(updated);
      }
    } catch (e) {
      console.error("refresh failed:", e);
    }
  }

  async function handleAdd() {
    if (!newContent.trim() || ci < 1 || te < 1 || fr < 1 || ea < 1) return;
    try {
      // Pass selectedOrg as 7th parameter
      await createItem(newContent, me, ci, te, fr, ea, selectedOrg);
      setShowAdd(false);
      setNewContent("");
      setCi(0); setTe(0); setFr(0); setEa(0);
      await loadItems();
    } catch (e) {
      alert(`Failed: ${e.message}`);
    }
  }

  // Normalize name display
  function displayName(name) {
    if (!name) return "Anonymous";
    // If it's a phone number or long identifier, return "Anonymous"
    if (/^\+?\d+$/.test(name) || name.length > 20) return "Anonymous";
    // If name contains space, take first name + first letter of last name
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}`;
    }
    return name;
  }

  // Check if item is mine
  function isMine(item) {
    if (!me) return false;
    const itemOwner = item.originator_name || item.user_id || "";
    const normalizedMe = me.toLowerCase().trim();
    const normalizedOwner = itemOwner.toLowerCase().trim();
    
    // Exact match
    if (normalizedOwner === normalizedMe) return true;
    
    // First name match
    const myFirstName = normalizedMe.split(/\s+/)[0];
    const ownerFirstName = normalizedOwner.split(/\s+/)[0];
    if (myFirstName && ownerFirstName && myFirstName === ownerFirstName) return true;
    
    return false;
  }

  // Get current org display name
  const currentOrgName = ORGANIZATIONS.find(org => org.id === selectedOrg)?.name || "St Michael's – Frideas";

  // Filter items by organization first, then by mine/all
  const orgFiltered = items.filter(item => {
    // Filter by organization
    const itemOrg = item.org_id || "ST_MICHAELS"; // Default to ST_MICHAELS if no org_id
    return itemOrg === selectedOrg;
  });

  const filtered = orgFiltered.filter(item => {
    if (filter === "mine") return isMine(item);
    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rank") return (b.priority_rank || 0) - (a.priority_rank || 0);
    if (sort === "date") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  return (
    <div className="page">
      <div className="bar">
        <div className="left">
          <span className="app">Felma</span>
          <span className="org">{currentOrgName}</span>
        </div>
        <div className="controls">
          <select className="view org-selector" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
            {ORGANIZATIONS.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <div className="who">
            <span className="label">You:</span>
            <input className="whoinp" placeholder="Your name" value={me} onChange={(e) => setMe(e.target.value)} />
          </div>
          <select className="view" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Items</option>
            <option value="mine">Mine Only</option>
          </select>
          <select className="view" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rank">By Rank (high → low)</option>
            <option value="date">By Date (newest first)</option>
          </select>
          <button className="btn" onClick={() => setShowAdd(true)}>+ New Item</button>
          <button className="btn" onClick={loadItems}>Refresh</button>
        </div>
      </div>

      <div className="grid">
        {sorted.map((item) => {
          const rank = item.priority_rank || item.rank || 0;
          const tier = item.action_tier || "⚪ Park for later";
          const isLeader = item.leader_to_unblock;
          const owner = displayName(item.originator_name || item.user_id);
          const mine = isMine(item);
          
          return (
            <div key={item.id} className="card" onClick={() => setOpenItem(item)}>
              <div className="pills">
                <span className="pill rank">{rank} rank</span>
                <span className="pill tier">{tier}</span>
                {isLeader && <span className="pill leader">Leader to Unblock</span>}
                <span className={`pill owner ${mine ? "berry" : ""}`}>{owner}</span>
              </div>
              <div className="title">{item.content || item.transcript || "Untitled"}</div>
              <div className="date">{new Date(item.created_at).toLocaleDateString()}</div>
              {item.stage && item.stage > 1 && (
                <div className="lifecycle-bar">
                  <div className="lifecycle-fill" style={{ width: `${((item.stage - 1) / 8) * 100}%` }} />
                  <span className="lifecycle-text">{item.stage}/9</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openItem && (
        <ItemDetail item={openItem} me={me} onClose={() => setOpenItem(null)} onUpdated={handleUpdated} />
      )}

      {showAdd && (
        <div className="modal" onClick={() => setShowAdd(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <div className="title">Add New Item</div>
              <button className="x" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <label className="lbl">Headline</label>
            <input className="txt" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
            <div className="field">
              <label>Customer impact <b>{ci === 0 ? "—" : ci}</b></label>
              <input type="range" min="0" max="10" value={ci} onChange={(e) => setCi(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Team energy <b>{te === 0 ? "—" : te}</b></label>
              <input type="range" min="0" max="10" value={te} onChange={(e) => setTe(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Frequency <b>{fr === 0 ? "—" : fr}</b></label>
              <input type="range" min="0" max="10" value={fr} onChange={(e) => setFr(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Ease <b>{ea === 0 ? "—" : ea}</b></label>
              <input type="range" min="0" max="10" value={ea} onChange={(e) => setEa(Number(e.target.value))} />
            </div>
            <div className="actions">
              <button className="ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary" disabled={!newContent.trim() || ci < 1 || te < 1 || fr < 1 || ea < 1} onClick={handleAdd}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
