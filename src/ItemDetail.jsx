// src/ItemDetail.jsx
import { useEffect, useState } from "react";
import { API, fmtDate, isMine, loadMe, postJSON, displayName } from "./logic";

export default function ItemDetail({ item, onClose, onUpdated }) {
  const [me] = useState(loadMe());
  const [editing, setEditing] = useState(false);
  const [ci, setCi] = useState(item.customer_impact ?? null);
  const [te, setTe] = useState(item.team_energy ?? null);
  const [fr, setFr] = useState(item.frequency ?? null);
  const [ea, setEa] = useState(item.ease ?? null);
  const canSave = [ci, te, fr, ea].every((v) => typeof v === "number");

  useEffect(() => {
    setCi(item.customer_impact ?? null);
    setTe(item.team_energy ?? null);
    setFr(item.frequency ?? null);
    setEa(item.ease ?? null);
  }, [item.id]);

  async function saveScores() {
    if (!canSave) return;
    try {
      const body = {
        customer_impact: ci,
        team_energy: te,
        frequency: fr,
        ease: ea,
      };
      await postJSON(`${API}/items/${item.id}/factors`, body);
      onUpdated?.();
      setEditing(false);
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    }
  }

  const Slider = ({ label, value, setValue }) => (
    <div className="field">
      <label>{label} <b>{value ?? "—"}</b></label>
      <input
        type="range"
        min="1" max="10" step="1"
        value={value ?? 1}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={(e) => setValue(Number(e.target.value))}
        onTouchEnd={(e) => setValue(Number(e.target.value))}
      />
      <div className="ticks">1<span/>5<span/>10</div>
    </div>
  );

  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="title">{item.content || "(untitled)"}</div>
        <button className="icon" onClick={onClose}>✕</button>
      </div>

      {/* ORDER you asked for */}
      <div className="grid meta">
        <div><div className="k">Originator</div><div className={`v ${isMine(me, item.originator_name || item.user_id) ? "mine" : ""}`}>
          {displayName(item.originator_name || item.user_id)}
        </div></div>
        <div><div className="k">Tier</div><div className="v">{item.action_tier || "—"}</div></div>
        <div><div className="k">Rank</div><div className="v">{item.priority_rank ?? 0}</div></div>
        <div><div className="k">Leader to Unblock</div><div className="v">{item.leader_to_unblock ? "Yes" : "—"}</div></div>
        <div><div className="k">Organisation</div><div className="v">St Michael's</div></div>
        <div><div className="k">Created</div><div className="v">{fmtDate(item.created_at)}</div></div>
      </div>

      <div className="field">
        <label>Response</label>
        <div className="note">{item.response || "—"}</div>
      </div>

      {!editing && (
        <div className="actions">
          <button className="primary" onClick={() => setEditing(true)}>Edit scores</button>
        </div>
      )}

      {editing && (
        <>
          <Slider label="Customer impact" value={ci} setValue={setCi} />
          <Slider label="Team energy" value={te} setValue={setTe} />
          <Slider label="Frequency" value={fr} setValue={setFr} />
          <Slider label="Ease" value={ea} setValue={setEa} />
          <div className="actions">
            <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="primary" disabled={!canSave} onClick={saveScores}>Save</button>
          </div>
        </>
      )}
    </div>
  );
}
