import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------
   KEEP YOUR KEYS: Replace the next line with your TWO real lines
   (do not change their values)
------------------------------------------------------------------- */
const SUPABASE_URL = "https://ryverzivsojfgtynsqux.supabase.co"; // <-- PASTE YOUR VALUES
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmVyeml2c29qZmd0eW5zcXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzA3MTcsImV4cCI6MjA3NTg0NjcxN30.a7FxSQgHHcuvixFakIw9ObQI7_hBSYp8IaJFD1Ma7Uw";        // <-- PASTE YOUR VALUES

/* After you paste your two lines above, this will work: */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Backend API (Render) */
const API = "https://felma-backend.onrender.com";

/* Simple router helper */
function matchDetailPath() {
  const m = location.pathname.match(/^\/item\/(\d+|[a-f0-9-]+)$/i);
  return m ? m[1] : null;
}

function isMe(name) {
  try {
    const me = localStorage.getItem("felma_me") || "";
    return me.trim().toLowerCase() === String(name || "").trim().toLowerCase();
  } catch {
    return false;
  }
}

function FactorSlider({ label, value, setValue }) {
  return (
    <div className="factor">
      <div className="row">
        <label>{label}</label>
        <span className="value">{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="ticks">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

function ItemDetail({ id, org }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // factor sliders, 1..10
  const [impact, setImpact] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [frequency, setFrequency] = useState(5);
  const [ease, setEase] = useState(5);

  useEffect(() => {
    let abort = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(
          `${API}/api/item/${id}${org ? `?org=${encodeURIComponent(org)}` : ""}`
        );
        if (!r.ok) throw new Error(`Load failed: ${r.status}`);
        const data = await r.json();
        if (abort) return;
        setItem(data);
        if (data.impact) setImpact(Number(data.impact));
        if (data.energy) setEnergy(Number(data.energy));
        if (data.frequency) setFrequency(Number(data.frequency));
        if (data.ease) setEase(Number(data.ease));
      } catch (e) {
        if (!abort) setErr(String(e.message || e));
      } finally {
        if (!abort) setLoading(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [id, org]);

  const quickRank = useMemo(() => {
    const vals = [impact, energy, frequency, ease].map(Number);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg);
  }, [impact, energy, frequency, ease]);

  async function saveFactors() {
    setSaving(true);
    setErr("");
    try {
      const body = {
        impact: Number(impact),
        energy: Number(energy),
        frequency: Number(frequency),
        ease: Number(ease),
      };
      const r = await fetch(
        `${API}/items/${id}/factors${org ? `?org=${encodeURIComponent(org)}` : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      const updated = await r.json();
      setItem(updated);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card">Loading…</div>;
  if (err) return <div className="card error">Error: {err}</div>;
  if (!item) return <div className="card">Not found.</div>;

  return (
    <div className="detail">
      <div className="crumbs">
        <a href={`/?org=${encodeURIComponent(org || "")}`}>← Back</a>
      </div>

      <h2 className="title">{item.item_title || item.content || "Untitled"}</h2>
      <p className="meta">
        <span className={`pill type ${item.item_type || "note"}`}>
          {(item.item_type || "note").toUpperCase()}
        </span>
        {item.originator_name ? (
          <span className="origin">
            {" "}
            by{" "}
            <strong className={isMe(item.originator_name) ? "me" : ""}>
              {item.originator_name}
            </strong>
          </span>
        ) : null}
      </p>

      <div className="grid2">
        <FactorSlider label="Impact" value={impact} setValue={setImpact} />
        <FactorSlider label="Energy" value={energy} setValue={setEnergy} />
        <FactorSlider label="Frequency" value={frequency} setValue={setFrequency} />
        <FactorSlider label="Ease" value={ease} setValue={setEase} />
      </div>

      <div className="rankbar">
        <span>Quick rank (avg):</span>
        <strong className="rank">{quickRank}</strong>
      </div>

      <button className="btn primary" onClick={saveFactors} disabled={saving}>
        {saving ? "Saving…" : "Save ranking"}
      </button>

      <div className="readback">
        <div className="badgewrap">
          {item.priority_rank ? (
            <span className="badge rank">Rank {item.priority_rank}</span>
          ) : null}
          {item.action_tier ? (
            <span className="badge tier">Tier {String(item.action_tier).toUpperCase()}</span>
          ) : null}
          {item.leader_to_unblock ? (
            <span className="badge leader">Leader to Unblock</span>
          ) : null}
        </div>
        <p className="hint">Badges reflect server truth after save.</p>
      </div>
    </div>
  );
}

function Shell({ children, me, setMe, org, onHome }) {
  return (
    <div className="wrap">
      <header className="mast">
        <div className="brand" onClick={onHome}>
          <span className="logo">Felma</span>
          <span className="muted">{org ? `· ${org}` : ""}</span>
        </div>
        <div className="whoami">
          <label>Who am I?</label>
          <input
            value={me}
            onChange={(e) => setMe(e.target.value)}
            placeholder="Your name (for 'my items' highlight)"
          />
        </div>
      </header>
      <main>{children}</main>
      <footer className="foot">
        <span>Felma · pilot</span>
      </footer>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const org = params.get("org") || "";
  const [me, setMe] = useState(localStorage.getItem("felma_me") || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState(() => {
    const id = matchDetailPath();
    return id ? { kind: "detail", id } : { kind: "list" };
  });

  useEffect(() => {
    localStorage.setItem("felma_me", me || "");
  }, [me]);

  useEffect(() => {
    if (view.kind !== "list") return;
    let abort = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        const url = new URL(`${API}/api/list`);
        if (org) url.searchParams.set("org", org);
        const r = await fetch(url.toString());
        if (!r.ok) throw new Error(`Load failed: ${r.status}`);
        const data = await r.json();
        if (!abort) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!abort) setErr(String(e.message || e));
      } finally {
        if (!abort) setLoading(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [org, view.kind]);

  // sort options
  const [sort, setSort] = useState("rank-desc");
  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === "rank-desc")
      copy.sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));
    else if (sort === "newest")
      copy.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    else if (sort === "leader")
      copy.sort(
        (a, b) => (b.leader_to_unblock ? 1 : 0) - (a.leader_to_unblock ? 1 : 0)
      );
    return copy;
  }, [items, sort]);

  if (view.kind === "detail") {
    return (
      <Shell
        me={me}
        setMe={setMe}
        org={org}
        onHome={() => {
          history.replaceState(null, "", `/?org=${encodeURIComponent(org)}`);
          setView({ kind: "list" });
        }}
      >
        <ItemDetail id={view.id} org={org} />
      </Shell>
    );
  }

  return (
    <Shell me={me} setMe={setMe} org={org}>
      <div className="toolbar">
        <div className="left">
          <label>Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rank-desc">Rank (high → low)</option>
            <option value="leader">Leader to Unblock</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="right">
          <a className="btn ghost" href={`/new?org=${encodeURIComponent(org)}`}>
            + New
          </a>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading…</div>
      ) : err ? (
        <div className="card error">Error: {err}</div>
      ) : sorted.length === 0 ? (
        <div className="empty">No items yet.</div>
      ) : (
        <div className="grid">
          {sorted.map((it) => (
            <div
              key={it.id}
              className="card item"
              onClick={() => {
                history.pushState(
                  null,
                  "",
                  `/item/${it.id}?org=${encodeURIComponent(org)}`
                );
                setView({ kind: "detail", id: String(it.id) });
              }}
            >
              <div className="row between">
                <span className={`pill type ${it.item_type || "note"}`}>
                  {String(it.item_type || "").toUpperCase()}
                </span>
                <div className="badgewrap">
                  {it.priority_rank ? (
                    <span className="badge rank">Rank {it.priority_rank}</span>
                  ) : null}
                  {it.action_tier ? (
                    <span className="badge tier">
                      Tier {String(it.action_tier).toUpperCase()}
                    </span>
                  ) : null}
                  {it.leader_to_unblock ? (
                    <span className="badge leader">Leader to Unblock</span>
                  ) : null}
                </div>
              </div>
              <h3 className="cardtitle">
                {it.item_title || it.content || "Untitled"}
              </h3>
              <p className="meta">
                {it.originator_name ? (
                  <>
                    by{" "}
                    <strong className={isMe(it.originator_name) ? "me" : ""}>
                      {it.originator_name}
                    </strong>
                  </>
                ) : null}
                {it.created_at ? (
                  <span> · {new Date(it.created_at).toLocaleDateString()}</span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
