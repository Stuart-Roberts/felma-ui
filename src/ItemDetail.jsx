// src/ItemDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { saveFactors, createItem, fmtDate, nameFor } from "./logic";

export default function ItemDetail({ open, onClose, item, mePhone, people, onSaved }) {
  if (!open) return null;

  const isNew = !item;
  const isMine = !isNew && item?.user_id && mePhone && item.user_id === mePhone;

  // Title
  const [title, setTitle] = useState(isNew ? "" : (item?.title || item?.transcript || ""));

  // Factors
  const [ci, setCi] = useState(isNew ? 0 : (item?.customer_impact ?? 0));
  const [te, setTe] = useState(isNew ? 0 : (item?.team_energy ?? 0));
  const [fq, setFq] = useState(isNew ? 0 : (item?.frequency ?? 0));
  const [ez, setEz] = useState(isNew ? 0 : (item?.ease ?? 0));

  // Save enablement
  const allSet = [ci, te, fq, ez].every(n => Number.isFinite(n) && n >= 1 && n <= 10);
  const canSave = isNew ? allSet && Boolean(mePhone) : allSet;

  useEffect(() => {
    // If item changes while open, sync fields
    if (!item) return;
    setTitle(item?.title || item?.transcript || "");
    setCi(item?.customer_impact ?? 0);
    setTe(item?.team_energy ?? 0);
    setFq(item?.frequency ?? 0);
    setEz(item?.ease ?? 0);
  }, [item]);

  const originatorName = useMemo(() => {
    return item ? nameFor(item.user_id, people) : nameFor(mePhone, people);
  }, [item, mePhone, people]);

  async function handleSave() {
    try {
      if (isNew) {
        const story = title?.trim() || "(untitled)";
        const { id } = await createItem({
          story,
          user_phone: mePhone || null,
          customer_impact: ci, team_energy: te, frequency: fq, ease: ez,
        });
        onSaved?.({ id, refresh: true });
        onClose();
        return;
      }
      // edit existing (send optional title only if mine)
      const payload = { customer_impact: ci, team_energy: te, frequency: fq, ease: ez };
      if (isMine && typeof title === "string") payload.title = title;
      await saveFactors(item.id, payload);
      onSaved?.({ id: item.id, refresh: true });
      onClose();
    } catch (e) {
      alert(`Save failed: ${e?.message || e}`);
    }
  }

  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="drawer-title">{isNew ? "New item" : "Edit item"}</div>
        <button className="x" onClick={onClose}>×</button>
      </div>

      {/* Title (editable if new, or mine) */}
      <label className="lbl">Story / title</label>
      <input
        className="txt"
        placeholder="Short title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={!isNew && !isMine}
      />

      {/* Meta — in your requested order */}
      {!isNew && (
        <div className="meta-grid">
          <Meta label="Originator" value={originatorName} />
          <Meta label="Tier" value={item?.action_tier || "—"} />
          <Meta label="Rank" value={Number.isFinite(item?.priority_rank) ? String(item.priority_rank) : "—"} />
          <Meta label="Leader to Unblock" value={item?.leader_to_unblock ? "Yes" : "No"} />
          <Meta label="Organisation" value={item?.org_slug ? "St Michael’s" : "—"} />
          <Meta label="Created" value={fmtDate(item?.created_at)} />
          <Meta label="Response" value={item?.response || "—"} wide />
        </div>
      )}

      <div className="sliders">
        <Slider label="Customer impact" value={ci} setValue={setCi} />
        <Slider label="Team energy" value={te} setValue={setTe} />
        <Slider label="Frequency" value={fq} setValue={setFq} />
        <Slider label="Ease" value={ez} setValue={setEz} />
        <p className="hint">Set all four (1–10). Save is disabled until you do.</p>
      </div>

      <div className="drawer-actions">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!canSave} onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

function Slider({ label, value, setValue }) {
  return (
    <div className="row">
      <div className="row-top">
        <span>{label}</span>
        <span className={value >= 1 ? "val" : "val pending"}>{value || 0}</span>
      </div>
      <input
        type="range"
        min="0" max="10" step="1"
        value={value || 0}
        onChange={e => setValue(Number(e.target.value))}
      />
    </div>
  );
}
function Meta({ label, value, wide }) {
  return (
    <div className={`meta ${wide ? "wide" : ""}`}>
      <div className="meta-label">{label}</div>
      <div className="meta-value">{value ?? "—"}</div>
    </div>
  );
}
