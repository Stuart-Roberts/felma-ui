// src/App.jsx — Felma UI (drop-in)
// Works with felma-backend routes:
//   GET  https://felma-backend.onrender.com/api/list
//   POST https://felma-backend.onrender.com/api/items

import { useEffect, useState } from "react";

const BACKEND_URL = "https://felma-backend.onrender.com";

export default function App() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // Load items on mount
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchItems() {
    setError("");
    setOk("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/list`, { method: "GET" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `List failed (${res.status})`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Could not load notes: ${e.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    const content = String(inputValue || "").trim();
    if (!content) {
      setError("Please type a note before saving.");
      return;
    }

    const payload = {
      content,
      item_type: "frustration", // default; we can add a toggle later
      user_id: null,
    };

    try {
      setSaving(true);
      const res = await fetch(`${BACKEND_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to parse JSON error, otherwise show raw text
        const text = await res.text();
        let message = text;
        try {
          const j = JSON.parse(text);
          message = j.error || JSON.stringify(j);
        } catch {
          /* ignore */
        }
        throw new Error(message || `Save failed (${res.status})`);
      }

      const created = await res.json();
      // Prepend the new item locally so the user sees it instantly
      setItems((prev) => [created, ...prev]);
      setInputValue("");
      setOk("Saved ✔︎");
    } catch (e) {
      setError(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Felma — Open Notes</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>New</label>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a quick note…"
            rows={3}
            style={styles.textarea}
          />
          <div style={styles.row}>
            <button type="submit" disabled={saving} style={styles.button}>
              {saving ? "Saving…" : "Save"}
            </button>
            {ok && <span style={styles.ok}>{ok}</span>}
            {error && <span style={styles.err}>✕ {error}</span>}
          </div>
        </form>
      </div>

      <div style={styles.listWrap}>
        {items.map((it) => (
          <div key={it.id ?? `${it.content}-${it.created_at ?? Math.random()}`} style={styles.item}>
            <div style={styles.itemTop}>
              <strong>{it.item_type === "idea" ? "Idea" : "Frustration"}:</strong>
              <span style={{ marginLeft: 8 }}>{it.content}</span>
            </div>
            <div style={styles.meta}>
              {formatWhen(it.created_at)} · org: {it.org_id ?? "—"} · team: {it.team_id ?? "—"}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={styles.empty}>No notes yet — add one above.</div>
        )}
      </div>
    </div>
  );
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

const styles = {
  page: { maxWidth: 820, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  title: { margin: "4px 0 12px 0", fontSize: 24 },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 14, color: "#6b7280" },
  textarea: { width: "100%", borderRadius: 8, border: "1px solid #d1d5db", padding: 10, fontSize: 15, outline: "none" },
  row: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },
  button: { background: "#111827", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer" },
  ok: { color: "#059669", fontSize: 14 },
  err: { color: "#dc2626", fontSize: 14 },
  listWrap: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  item: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 },
  itemTop: { fontSize: 15 },
  meta: { marginTop: 6, fontSize: 12, color: "#6b7280" },
  empty: { color: "#6b7280", fontSize: 14, padding: 12, textAlign: "center" },
};
