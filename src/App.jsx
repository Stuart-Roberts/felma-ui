import React, { useEffect, useState } from "react";

const BASE = "https://felma-backend.onrender.com"; // backend URL

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}\n${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await api("/api/list");
      setItems(list);
    } catch (e) {
      setErr(String(e.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createItem() {
    const content = window.prompt("New item — short description:");
    if (!content) return;
    try {
      await api("/api/items", { method: "POST", body: JSON.stringify({ content }) });
      await load();
    } catch (e) {
      alert("Create failed:\n" + String(e.message || e));
    }
  }

  function openDetail(it) {
    window.open(`${BASE}/api/item/${it.id}`, "_blank"); // opens JSON for pilot
  }

  return (
    <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Felma</h1>
        <button
          onClick={createItem}
          style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 8,
                   border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
                   cursor: "pointer" }}
        >+ New</button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Backend:{" "}
        <a href={`${BASE}/api/health`} target="_blank" rel="noreferrer">
          {BASE}/api/health
        </a>{" "}
        ·{" "}
        <a href={`${BASE}/api/list`} target="_blank" rel="noreferrer">
          {BASE}/api/list
        </a>
      </div>

      {loading && <p style={{ marginTop: 24 }}>Loading…</p>}

      {!!err && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          border: "1px solid rgba(255,0,0,0.4)", background: "rgba(255,0,0,0.08)",
          whiteSpace: "pre-wrap"
        }}>
          Error loading list:{"\n"}{err}
        </div>
      )}

      {!loading && !err && items.length === 0 && <p style={{ marginTop: 24 }}>No items yet.</p>}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16, marginTop: 16
      }}>
        {items.map((it) => {
          const title = it.item_title || it.content || it.transcript || it.story_json?.title || "Untitled";
          const date = it.created_at || it.created || it.updated_at || it.updated || "";
          return (
            <button key={it.id} onClick={() => openDetail(it)} style={{
              textAlign: "left", borderRadius: 12, padding: 16,
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{date?.slice(0,10)}</div>
              <div style={{ fontWeight: 600 }}>{title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
