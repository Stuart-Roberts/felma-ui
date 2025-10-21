import React, { useEffect, useMemo, useState } from "react";
import ItemDetail from "./ItemDetail.jsx";
import "./App.css";

// ✅ Your backend base URL
const BASE = "https://felma-backend.onrender.com";

// Helper: safe number & date
const num = (v) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const first = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== "");
const toDate = (it) => new Date(first(it.created_at, it.created, it.updated_at, it.updated, Date.now()));

// Generic API
async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState(() => localStorage.getItem("felma_sort") || "rank_desc");
  const [who, setWho] = useState(() => localStorage.getItem("felma_who") || "");
  const [detail, setDetail] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await api("/api/list");
        // Backend may return {items:[...]} or [...]. Normalize.
        setItems(Array.isArray(data) ? data : data.items || []);
      } catch (e) {
        setErr(String(e.message || e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => localStorage.setItem("felma_sort", sort), [sort]);
  useEffect(() => localStorage.setItem("felma_who", who), [who]);

  const sorted = useMemo(() => {
    const byRank = (a, b) =>
      num(b.rank ?? b.priority_rank) - num(a.rank ?? a.priority_rank);
    const byDateDesc = (a, b) => toDate(b) - toDate(a);
    const byDateAsc = (a, b) => toDate(a) - toDate(b);

    const copy = [...items];
    if (sort === "rank_desc") copy.sort(byRank);
    else if (sort === "date_new") copy.sort(byDateDesc);
    else copy.sort(byDateAsc);
    return copy;
  }, [items, sort]);

  const highlightIds = useMemo(() => {
    if (!who.trim()) return new Set();
    const lower = who.trim().toLowerCase();
    const ids = sorted
      .filter((it) => {
        const owner = first(it.originator_name, it.user_name, it.user_id, "");
        return String(owner).toLowerCase().includes(lower);
      })
      .map((it) => it.id);
    return new Set(ids);
  }, [sorted, who]);

  async function createItem() {
    if (!newText.trim()) return;
    setCreating(true);
    try {
      await api("/api/items", {
        method: "POST",
        body: JSON.stringify({ content: newText.trim(), originator_name: who || undefined }),
      });
      setNewText("");
      // reload list
      const data = await api("/api/list");
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      alert("Couldn't create item:\n" + String(e.message || e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">Felma</div>
        <div className="spacer" />
        <div className="who">
          <label htmlFor="who">Who am I?</label>
          <input
            id="who"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Your name (for 'my items' highlight)"
          />
        </div>
        <div className="controls">
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="rank_desc">Rank (high → low)</option>
            <option value="date_new">Date (new → old)</option>
            <option value="date_old">Date (old → new)</option>
          </select>
          <button className="primary" onClick={() => document.getElementById("new-modal").showModal()}>
            + New
          </button>
        </div>
      </header>

      {err && <div className="error">Error loading: {err}</div>}
      {loading && <div className="hint">Loading…</div>}
      {!loading && !err && sorted.length === 0 && <div className="hint">No items yet.</div>}

      <main className="grid">
        {sorted.map((it) => {
          const title =
            first(it.item_title, it.content, it.transcript, it.story_json?.title) || "Untitled";
          const dt = toDate(it).toISOString().slice(0, 10);
          const rank = num(it.rank ?? it.priority_rank);
          const tier =
            first(it.tier, it.tier_name) ||
            (rank >= 66 ? "🚀 MOVE NOW" : rank >= 33 ? "⬆️ MOVE IT FORWARD" : "⏳ WHEN TIME ALLOWS");
          const tag = first(it.item_type, it.type, "FRUSTRATION");

          const highlight = highlightIds.has(it.id);

          return (
            <button
              key={it.id}
              className={`card ${highlight ? "card--mine" : ""}`}
              onClick={() => setDetail(it)}
              title="Open details"
            >
              <div className="badges">
                <span className="tag">{String(tag).toUpperCase()}</span>
                <span className="chip">Rank {rank}</span>
                <span className="chip">Tier {tier}</span>
              </div>
              <div className="title">{title}</div>
              <div className="meta">{dt}</div>
            </button>
          );
        })}
      </main>

      {/* Detail drawer */}
      {detail && <ItemDetail item={detail} onClose={() => setDetail(null)} />}

      {/* New item modal */}
      <dialog id="new-modal" className="modal">
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            createItem().then(() => document.getElementById("new-modal").close());
          }}
        >
          <h3 style={{ margin: 0 }}>Create new item</h3>
          <p className="soft">A short description is enough for the pilot.</p>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Describe the issue or suggestion…"
            rows={5}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" onClick={() => document.getElementById("new-modal").close()}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
