import { useEffect, useState } from "react";
import { Routes, Route, Link, NavLink, useParams, useNavigate } from "react-router-dom";
import "./App.css";

// Use cloud API if present, else local
const API = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function Layout({ children }) {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#0b6" : "#055",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#fafafa", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Simple header */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <NavLink to="/" style={{ textDecoration: "none", color: "#0b6", fontWeight: 800 }}>Felma</NavLink>
          <NavLink to="/" style={linkStyle}>Home</NavLink>
          <NavLink to="/stories" style={linkStyle}>Stories</NavLink>
        </div>
        {children}
      </div>
    </div>
  );
}

function ListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/list`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("List fetch error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Layout>Loading…</Layout>;
  if (!items.length) return <Layout>No notes yet.</Layout>;

  return (
    <Layout>
      <h1>Felma — Open Notes</h1>
      {items.map((it) => (
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
      ))}
    </Layout>
  );
}

function StoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/list`);
        const data = await res.json();
        // For now, show everything. Later we can filter by status/story fields.
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Stories fetch error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Layout>Loading…</Layout>;

  return (
    <Layout>
      <h1>Stories your team has noticed and started shaping.</h1>
      {items.length === 0 && <div>No stories yet — check back soon.</div>}
      {items.map((it) => (
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
      ))}
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

  useEffect(() => {
    load();
  }, [id]);

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
                  type="number"
                  min="1"
                  max="10"
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
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/item/:id" element={<ItemPage />} />
    </Routes>
  );
}