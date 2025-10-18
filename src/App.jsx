import { useEffect, useState } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import "./App.css";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function Layout({ children }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#fafafa", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function NewNoteForm({ onCreated }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/api/items`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    transcript: text,
    item_type: "frustration",
    user_id: null
  }),
});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setText("");
      setMsg("Saved.");
      onCreated?.(data);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>+ New</div>
      <textarea
        rows={3}
        placeholder="Type a quick note (frustration or idea)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving || !text.trim()}>{saving ? "Saving…" : "Save"}</button>
        {msg && <div style={{ alignSelf: "center", color: "#555" }}>{msg}</div>}
      </div>
    </form>
  );
}

function ListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/list`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("List fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Layout>Loading…</Layout>;

  return (
    <Layout>
      <h1>Felma — Open Notes</h1>

      <NewNoteForm onCreated={load} />

      {!items.length ? (
        <div>No notes yet.</div>
      ) : (
        items.map((it) => (
          <div key={it.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fff" }}>
            <div style={{ fontWeight: 600 }}>{it.title}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{new Date(it.created_at).toLocaleString()}</div>
            <div style={{ marginTop: 4 }}>
              Tier: {it.action_tier ?? "—"} {it.leader_to_unblock ? "🚩" : ""} | Rank: {it.priority_rank ?? "—"}
            </div>
            <Link to={`/item/${it.id}`}>
              <button style={{ marginTop: 8 }}>Open</button>
            </Link>
          </div>
        ))
      )}
    </Layout>
  );
}

function ItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/item/${id}`);
      const data = await res.json();
      setItem(data);
      setForm({
        customer_impact: data.customer_impact ?? "",
        team_energy: data.team_energy ?? "",
        frequency: data.frequency ?? "",
        ease: data.ease ?? "",
        user_next_step: data.user_next_step ?? "",
      });
    } catch (err) {
      console.error("Detail fetch error", err);
    }
  };

  useEffect(() => { load(); }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${API}/items/${id}/factors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(`✅ Saved: ${data.action_tier} | PR=${data.priority_rank}`);
      await load();
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  if (!item) return <Layout>Loading…</Layout>;

  return (
    <Layout>
      <button onClick={() => navigate(-1)}>&larr; Back</button>
      <h2 style={{ marginTop: 12 }}>{item.item_title || item.transcript}</h2>
      <div style={{ color: "#666", marginBottom: 8 }}>{new Date(item.created_at).toLocaleString()}</div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
        <div>Tier: {item.action_tier ?? "—"} | Rank: {item.priority_rank ?? "—"}</div>
        {item.leader_to_unblock && <div style={{ color: "#a00" }}>🚩 Leader to Unblock</div>}

        <form onSubmit={save} style={{ marginTop: 12 }}>
          {["customer_impact","team_energy","frequency","ease"].map((f) => (
            <div key={f} style={{ marginBottom: 8 }}>
              <label style={{ display: "block" }}>
                {f.replace("_", " ")}:
                <input
                  type="number" min="1" max="10"
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            </div>
          ))}
          <label style={{ display: "block", marginBottom: 8 }}>
            Next step:
            <textarea
              rows="3"
              value={form.user_next_step}
              onChange={(e) => setForm({ ...form, user_next_step: e.target.value })}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
          <button type="submit">Save</button>
        </form>
        {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListPage />} />
      <Route path="/item/:id" element={<ItemPage />} />
      <Route path="*" element={<Layout>Not Found</Layout>} />
    </Routes>
  );
}