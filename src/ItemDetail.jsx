// src/ItemDetail.jsx - COMPLETE FILE
import { useState } from "react";
import { API, fmtDate, isMine, postJSON, displayName } from "./logic";

export default function ItemDetail({ item, me, onClose, onUpdated }) {
  const [working, setWorking] = useState(false);
  const [ci, setCi] = useState(item.customer_impact ?? 0);
  const [te, setTe] = useState(item.team_energy ?? 0);
  const [fr, setFr] = useState(item.frequency ?? 0);
  const [ea, setEa] = useState(item.ease ?? 0);

  const allSet = [ci, te, fr, ea].every(n => n >= 1 && n <= 10);
  const mine = me && isMine(me, item.user_id || item.originator_name);

  async function saveFactors() {
    if (!allSet || working) return;
    setWorking(true);
    try {
      await postJSON(`${API}/items/${item.id}/factors`, {
        customer_impact: ci,
        team_energy: te,
        frequency: fr,
        ease: ea,
      });
      onUpdated?.();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setWorking(false);
    }
  }

  const Slider = ({ label, value, setValue }) => (
    <div className="field">
      <label>
        {label} <b>{value === 0 ? "—" : value}</b>
      </label>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="ticks">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );

  const rank = Number(item.rank ?? item.priority_rank ?? 0);
  const tier = item.action_tier || "—";

  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="title">{item.content || item.transcript || "Untitled"}</div>
        <button className="x" onClick={onClose}>×</button>
      </div>

      <div className="kv">
        <div>Originator</div>
        <div className={mine ? "val berry" : "val"}>
          {displayName(item.originator_name || item.user_id)}
        </div>
      </div>

      <div className="kv">
        <div>Tier</div>
        <div className="val">{tier}</div>
      </div>

      <div className="kv">
        <div>Rank</div>
        <div className="val">{rank}</div>
      </div>

      <div className="kv">
        <div>Leader to Unblock</div>
        <div className="val">{item.leader_to_unblock ? "Yes" : "No"}</div>
      </div>

      <div className="kv">
        <div>Organisation</div>
        <div className="val">{item.organisation || "St Michael's"}</div>
      </div>

      <div className="kv">
        <div>Created</div>
        <div className="val">{fmtDate(item.created_at)}</div>
      </div>

      {item.response && (
        <div className="kv">
          <div>Response</div>
          <div className="val">{item.response}</div>
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid var(--line)` }}>
        <div className="rating-label" style={{ marginBottom: 16 }}>Rate this item (0–10)</div>
        
        <Slider label="Customer impact" value={ci} setValue={setCi} />
        <Slider label="Team energy" value={te} setValue={setTe} />
        <Slider label="Frequency" value={fr} setValue={setFr} />
        <Slider label="Ease" value={ea} setValue={setEa} />

        <div className="actions">
          <button
            className="primary"
            disabled={!allSet || working}
            onClick={saveFactors}
            title={!allSet ? "Please set all factors (1-10)" : ""}
          >
            {working ? "Saving…" : "Save ratings"}
          </button>
        </div>
      </div>
    </div>
  );
}
