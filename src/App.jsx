// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import ItemDetail from "./ItemDetail.jsx";
import NewItem from "./NewItem.jsx";
import {
  API, getJSON, loadMe, saveMe, isMine, displayName, fmtDate,
} from "./logic";
import { STR } from "./text";

export default function App() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(loadMe());
  const [view, setView] = useState("rank"); // rank | newest | mine
  const [selection, setSelection] = useState(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    // simple list; backend already returns fields we need
    const data = await getJSON(`${API}/api/list`);
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { saveMe(me); }, [me]);

  const filtered = useMemo(() => {
    let rows = [...items];
    if (view === "rank") {
      rows.sort((a,b) => (b.priority_rank ?? 0) - (a.priority_rank ?? 0));
    } else if (view === "newest") {
      rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (view === "mine") {
      rows = rows.filter(r => isMine(me, r.originator_name || r.user_id));
      rows.sort((a,b) => (b.priority_rank ?? 0) - (a.priority_rank ?? 0));
    }
    return rows;
  }, [items, view, me]);

  return (
    <div className="wrap">
      <header className="bar">
        <div className="left">
          <div className="brand">Felma</div>
          <div className="org">
            <div className="org-name">St Michael&apos;s – Frideas</div>
          </div>
        </div>

        <div className="right">
          <label className="me">
            <span>{STR.meLabel}</span>
            <input
              value={me}
              placeholder={STR.mePlaceholder}
              onChange={(e) => setMe(e.target.value)}
            />
          </label>

          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="rank">{STR.viewAllRank}</option>
            <option value="newest">{STR.viewAllNewest}</option>
            <option value="mine">{STR.viewMine}</option>
          </select>

          <button className="ghost" onClick={() => load()}>{STR.refresh}</button>
          <button className="primary" onClick={() => setAdding(true)}>{STR.newItem}</button>
        </div>
      </header>

      <main className="grid">
        {filtered.map((it) => (
          <article key={it.id} className="card" onClick={() => setSelection(it)}>
            <div className="row pills">
              <span className="pill rank">RANK <b>{it.priority_rank ?? 0}</b></span>
              <span className="pill tier">Tier <b>{(it.action_tier || "—").split(" ").slice(0,3).join(" ")}</b></span>
              {it.leader_to_unblock ? (
                <span className="pill unblock">Leader to Unblock</span>
              ) : null}
              <span className={`pill owner ${isMine(me, it.originator_name || it.user_id) ? "mine" : ""}`}>
                Originator: <b>{displayName(it.originator_name || it.user_id)}</b>
              </span>
            </div>
            <div className="title">{it.content || "(untitled)"}</div>
            <div className="date">{fmtDate(it.created_at)}</div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="empty">{STR.noItems}</div>
        )}
      </main>

      {selection && (
        <ItemDetail
          item={selection}
          onClose={() => setSelection(null)}
          onUpdated={async () => {
            await load();
            const updated = (await getJSON(`${API}/api/get?id=${selection.id}`)).item;
            setSelection(updated);
          }}
        />
      )}

      {adding && (
        <NewItem
          onClose={() => setAdding(false)}
          onCreated={async () => load()}
        />
      )}
    </div>
  );
}
