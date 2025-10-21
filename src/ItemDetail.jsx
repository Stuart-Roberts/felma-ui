// src/ItemDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { displayName, isMine } from "./people";
import { computePriorityRank, tierForPR, shouldLeaderUnblock } from "./logic";

const API =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
  "https://felma-backend.onrender.com";

function fmtDate(d) {
  try {
    const dt = new Date(d);
    // 20-Oct-'25 (GB style)
    const day = dt.toLocaleString("en-GB", { day: "2-digit" });
    const mon = dt.toLocaleString("en-GB", { month: "short" });
    const yr = String(dt.getFullYear()).slice(-2);
    return `${day}-${mon}-’${yr}`;
  } catch {
    return "—";
  }
}

export default function ItemDetail({ item, onClose, onUpdated, viewerMe }) {
  const [working, setWorking] = useState(false);

  // factor sliders (pre-fill if present)
  const [customer, setCustomer] = useState(item?.customer_impact ?? 0);
  const [team, setTeam] = useState(item?.team_energy ?? 0);
  const [freq, setFreq] = useState(item?.frequency ?? 0);
  const [ease, setEase] = useState(item?.ease ?? 0);

  useEffect(() => {
    setCustomer(item?.customer_impact ?? 0);
    setTeam(item?.team_energy ?? 0);
    setFreq(item?.frequency ?? 0);
    setEase(item?.ease ?? 0);
  }, [item?.id]);

  const allSet = customer >= 1 && team >= 1 && freq >= 1 && ease >= 1;

  // Live preview of rank/tier/unblock when sliders change
  const preview = useMemo(() => {
    if (!allSet) return null;
    const pr = computePriorityRank(customer, team, freq, ease);
    return {
      pr,
      tier: tierForPR(pr),
      unblock: shouldLeaderUnblock(team, ease),
    };
  }, [customer, team, freq, ease, allSet]);

  async function saveFactors() {
    if (!item?.id || !allSet) return;
    setWorking(true);
    try {
      const res = await fetch(`${API}/items/${item.id}/factors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_impact: customer,
          team_energy: team,
          frequency: freq,
          ease: ease,
          user_next_step: null,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to save");
      }
      // refresh the item in the parent
      onUpdated?.();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setWorking(false);
    }
  }

  if (!item) return null;

  const originatorLabel = displayName(item.user_id || item.originator_name);
  const mine = isMine(viewerMe, item.user_id);

  return (
    <aside className="drawer">
      <header className="drawer-header">
        <div className="drawer-title">{item.content || item.transcript || "Untitled"}</div>
        <button className="xbtn" onClick={onClose}>✕</button>
      </header>

      <div className="drawer-body">
        {/* Order requested: Originator, Tier, Rank, Leader, Org, Created, Response */}
        <div className="kv">
          <div>Originator</div>
          <div className={mine ? "val berry" : "val"}>{originatorLabel}</div>
        </div>

        <div className="kv">
          <div>Tier</div>
          <div className="val">{item.action_tier || "—"}</div>
        </div>

        <div className="kv">
          <div>Rank</div>
          <div className="val">{item.priority_rank ?? 0}</div>
        </div>

        <div className="kv">
          <div>Leader to Unblock</div>
          <div className="val">
            {item.leader_to_unblock ? (
              <span className="pill pill-unblock">Leader to Unblock</span>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="kv">
          <div>Organisation</div>
          <div className="val">{item.org_name || "St Michael’s"}</div>
        </div>

        <div className="kv">
          <div>Created</div>
          <div className="val">{fmtDate(item.created_at)}</div>
        </div>

        <div className="kv">
          <div>Response</div>
          <div className="val">{item.response || "—"}</div>
        </div>

        <hr className="sep" />

        <h4>Rate this item (1–10)</h4>
        <div className="sl-block">
          <label>Customer Impact <b>{customer || "—"}</b></label>
          <input type="range" min="1" max="10" value={customer}
            onChange={e => setCustomer(Number(e.target.value))}/>
        </div>
        <div className="sl-block">
          <label>Team Energy <b>{team || "—"}</b></label>
          <input type="range" min="1" max="10" value={team}
            onChange={e => setTeam(Number(e.target.value))}/>
        </div>
        <div className="sl-block">
          <label>Frequency <b>{freq || "—"}</b></label>
          <input type="range" min="1" max="10" value={freq}
            onChange={e => setFreq(Number(e.target.value))}/>
        </div>
        <div className="sl-block">
          <label>Ease <b>{ease || "—"}</b></label>
          <input type="range" min="1" max="10" value={ease}
            onChange={e => setEase(Number(e.target.value))}/>
        </div>

        {preview && (
          <div className="preview">
            <div><strong>Preview</strong></div>
            <div>Rank: <b>{preview.pr}</b></div>
            <div>Tier: <b>{preview.tier}</b></div>
            <div>Leader to Unblock: <b>{preview.unblock ? "Yes" : "No"}</b></div>
          </div>
        )}

        <div className="actions">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-primary"
                  disabled={!allSet || working}
                  onClick={saveFactors}>
            {working ? "Saving…" : "Save ratings"}
          </button>
        </div>
      </div>
    </aside>
  );
}
