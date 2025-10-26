import { useEffect, useState } from "react";
import { API, fetchJSON } from "./logic";
import ItemDetail from "./ItemDetail";
import AddItem from "./AddItem";

export default function App() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState("");
  const [sort, setSort] = useState("rank");
  const [openItem, setOpenItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const { items: arr } = await fetchJSON(`${API}/list`);
      setItems(arr || []);
    } catch (e) {
      console.error("load failed:", e);
    }
  }

  async function handleUpdated() {
    await loadItems();
    if (openItem) {
      const fresh = await fetchJSON(`${API}/list`);
      const updated = fresh.items?.find(i => i.id === openItem.id);
      if (updated) setOpenItem(updated);
    }
  }

  const sorted = [...items].sort((a, b) => {
    if (sort === "rank") return (b.priority_rank || 0) - (a.priority_rank || 0);
    if (sort === "date") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  return (
    <div className="page">
      <div className="bar">
        <div className="left">
          <div className="demo">DEMO</div>
          <div className="app">Felma</div>
          <div className="org">St Michael's – Frideas</div>
        </div>
        <div className="controls">
          <div className="who">
            <span className="label">You:</span>
            <input
              className="whoinp"
              placeholder="Your name"
              value={me}
              onChange={(e) => setMe(e.target.value)}
            />
          </div>
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
          const owner = item.originator_name || item.user_id || "Unknown";

          return (
            <div key={item.id} className="card" onClick={() => setOpenItem(item)}>
              <div className="pills">
                <span className="pill rank">rank {rank}</span>
                <span className="pill tier">{tier}</span>
                {isLeader && <span className="pill leader">Leader to Unblock</span>}
                <span className="pill owner">{owner}</span>
              </div>
              <div className="title">{item.content || item.transcript || "Untitled"}</div>
              <div className="date">{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>

      {openItem && (
        <ItemDetail
          item={openItem}
          me={me}
          onClose={() => setOpenItem(null)}
          onUpdated={handleUpdated}
        />
      )}

      {showAdd && (
        <AddItem
          me={me}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadItems(); }}
        />
      )}
    </div>
  );
}
