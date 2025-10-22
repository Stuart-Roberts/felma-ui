import React, { useEffect, useMemo, useState } from "react";
import { fetchItems, fetchPeople, createItem, updateFactors } from "./logic";

const ORG_NAME = "St Michael’s – Frideas";

export default function App() {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [me, setMe] = useState("+447827276091"); // user’s phone; free text box on header
  const [drawer, setDrawer] = useState({ open: false, mode: "new", item: null });

  // load
  async function load() {
    const [it, peeps] = await Promise.all([fetchItems(), fetchPeople()]);
    setItems(it);
    setPeople(peeps);
  }
  useEffect(() => { load(); }, []);

  // helpers
  const nameByPhone = useMemo(() => {
    const m = new Map();
    for (const p of people) {
      if (p.phone) m.set(String(p.phone), p.display_name || p.full_name || p.email || p.phone);
    }
    return m;
  }, [people]);

  const meName = nameByPhone.get(me) || me;

  function originatorPill(item) {
    const phone = item.user_id ? String(item.user_id) : null;
    const label = phone ? (nameByPhone.get(phone) || phone) : "—";
    const isMe = phone && phone === me;
    return <span className={`pill originator ${isMe ? "me" : ""}`}>{label}</span>;
  }

  function tierPill(t) {
    if (!t) return <span className="pill tier">Tier</span>;
    return <span className="pill tier">{t}</span>;
  }

  function rankPill(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return <span className="pill rank">RANK —</span>;
    return <span className="pill rank">RANK {n}</span>;
  }

  function leaderPill(flag) {
    return flag ? <span className="pill unblock">Leader to Unblock</span> : null;
  }

  function openNew() {
    setDrawer({
      open: true,
      mode: "new",
      item: {
        title: "",
        customer_impact: 0, team_energy: 0, frequency: 0, ease: 0
      }
    });
  }
  function openEdit(it) {
    setDrawer({
      open: true,
      mode: "edit",
      item: {
        id: it.id,
        title: it.title || "",
        customer_impact: it.customer_impact ?? 0,
        team_energy: it.team_energy ?? 0,
        frequency: it.frequency ?? 0,
        ease: it.ease ?? 0
      }
    });
  }

  return (
    <div className="app">
      {/* header */}
      <div className="header">
        <div className="h-brand">Felma</div>
        <div className="h-org">{ORG_NAME}</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#86a8b3" }}>Me:</span>
        <input className="me" value={me} onChange={e=>setMe(e.target.value)} />
        <button className="refresh" onClick={load}>Refresh</button>
        <button className="btn" onClick={openNew}>+ New</button>
      </div>

      {/* grid */}
      {items.length === 0 ? (
        <div style={{ color:"#86a8b3", marginTop: 24 }}>No items yet.</div>
      ) : (
        <div className="grid">
          {items.map(it => (
            <div className="card" key={it.id} onClick={()=>openEdit(it)}>
              <div className="row">
                {rankPill(it.priority_rank)}
                {tierPill(it.action_tier)}
                {leaderPill(it.leader_to_unblock)}
              </div>
              <div className="title">{it.title || "(untitled)"}</div>
              <div className="row" style={{ marginTop: 6, gap: 8 }}>
                {originatorPill(it)}
                <span className="meta">{new Date(it.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <Drawer state={drawer} setState={setDrawer} me={me} onSaved={async()=>{
        await load();
      }}/>
    </div>
  );
}

function Drawer({ state, setState, me, onSaved }) {
  const { open, mode } = state;
  const isNew = mode === "new";
  const [title, setTitle] = useState("");
  const [ci, setCI] = useState(0);
  const [te, setTE] = useState(0);
  const [fr, setFR] = useState(0);
  const [ea, setEA] = useState(0);
  const [saving, setSaving] = useState(false);

  // sync when opening
  useEffect(()=>{
    if (!open) return;
    setTitle(state.item?.title || "");
    setCI(state.item?.customer_impact ?? 0);
    setTE(state.item?.team_energy ?? 0);
    setFR(state.item?.frequency ?? 0);
    setEA(state.item?.ease ?? 0);
  }, [open]);

  function close(){ setState(s=>({ ...s, open:false })); }

  const factorsValid = ci>0 && te>0 && fr>0 && ea>0 && ci<=10 && te<=10 && fr<=10 && ea<=10;
  const canSave = isNew ? (title.trim().length>0 && factorsValid) : factorsValid;

  async function onSave(){
    if (!canSave || saving) return;
    setSaving(true);
    try{
      if (isNew){
        await createItem({
          title: title.trim(),
          customer_impact: ci, team_energy: te, frequency: fr, ease: ea,
          user_id: me
        });
      } else {
        // Title editing for existing items would need a backend route — keeping factors only.
        await updateFactors(state.item.id, { customer_impact: ci, team_energy: te, frequency: fr, ease: ea });
      }
      close();
      await onSaved?.();
    } catch (e){
      alert(`Save failed: ${e.message||e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`drawer ${open ? "open":""}`}>
      {open && <div className="overlay" onClick={close} />}
      {open && (
        <div className="panel">
          <h3>{isNew ? "New item" : "Edit item"}</h3>

          <div className="group">
            <div className="label"><span>Story / title</span>{!isNew && <span style={{fontSize:12,color:"#8fb1bb"}}>title locked for now</span>}</div>
            <input className="input" placeholder="Short title…" value={title} onChange={e=>setTitle(e.target.value)} disabled={!isNew}/>
          </div>

          <div className="group">
            <div className="label"><span>Customer impact</span><strong>{ci}</strong></div>
            <div className="slider-row"><input type="range" min="0" max="10" value={ci} onChange={e=>setCI(Number(e.target.value))} /></div>
          </div>
          <div className="group">
            <div className="label"><span>Team energy</span><strong>{te}</strong></div>
            <div className="slider-row"><input type="range" min="0" max="10" value={te} onChange={e=>setTE(Number(e.target.value))} /></div>
          </div>
          <div className="group">
            <div className="label"><span>Frequency</span><strong>{fr}</strong></div>
            <div className="slider-row"><input type="range" min="0" max="10" value={fr} onChange={e=>setFR(Number(e.target.value))} /></div>
          </div>
          <div className="group">
            <div className="label"><span>Ease</span><strong>{ea}</strong></div>
            <div className="slider-row"><input type="range" min="0" max="10" value={ea} onChange={e=>setEA(Number(e.target.value))} /></div>
            <div className="slider-note">Set all four (1–10). Save is disabled until you do.</div>
          </div>

          <div className="actions">
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" disabled={!canSave || saving} onClick={onSave}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
