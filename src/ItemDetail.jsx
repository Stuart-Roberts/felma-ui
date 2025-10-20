import { useEffect, useMemo, useState } from "react";

const API = "https://felma-backend.onrender.com";

export default function ItemDetail({ id, org }) {
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
        const r = await fetch(`${API}/api/item/${id}${org ? `?org=${encodeURIComponent(org)}` : ""}`);
        if (!r.ok) throw new Error(`Load failed: ${r.status}`);
        const data = await r.json();
        if (abort) return;
        setItem(data);
        // use existing values if present
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
    return () => { abort = true; };
  }, [id, org]);

  const quickRank = useMemo(() => {
    // simple average 1..10 (server remains authority)
    const vals = [impact, energy, frequency, ease].map(Number);
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
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
      const r = await fetch(`${API}/items/${id}/factors${org ? `?org=${encodeURIComponent(org)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
        <a href={`/?org=${encodeURIComponent(org||"")}`}>← Back</a>
      </div>

      <h2 className="title">{item.item_title || item.content || "Untitled"}</h2>
      <p className="meta">
        <span className={`pill type ${item.item_type || "note"}`}>{(item.item_type || "note").toUpperCase()}</span>
        {item.originator_name ? (
          <span className="origin">
            by <strong className={isMe(item.originator_name) ? "me" : ""}>{item.originator_name}</strong>
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
          {item.priority_rank ? <span className="badge rank">Rank {item.priority_rank}</span> : null}
          {item.action_tier ? <span className="badge tier">Tier {String(item.action_tier).toUpperCase()}</span> : null}
          {item.leader_to_unblock ? <span className="badge leader">Leader to Unblock</span> : null}
        </div>
        <p className="hint">Badges reflect server truth after save.</p>
      </div>
    </div>
  );
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
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

function isMe(name) {
  try {
    const me = localStorage.getItem("felma_me") || "";
    return me.trim().toLowerCase() === String(name||"").trim().toLowerCase();
  } catch { return false; }
}
