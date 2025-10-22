// src/NewItem.jsx
import { useEffect, useState } from "react";
import { API, loadMe, postJSON } from "./logic";

export default function NewItem({ onClose, onCreated }) {
  const [me, setMe] = useState(loadMe());
  const [content, setContent] = useState("");
  const [ci, setCi] = useState(null);
  const [te, setTe] = useState(null);
  const [fr, setFr] = useState(null);
  const [ea, setEa] = useState(null);
  const [busy, setBusy] = useState(false);
  const canSave = content.trim().length > 0 && [ci, te, fr, ea].every((v) => typeof v === "number");

  useEffect(() => {
    // keep me field in sync if user edits the header
    const onStorage = () => setMe(loadMe());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function save() {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      await postJSON(`${API}/items/new`, {
        content: content.trim(),
        originator_name: me || null,  // we prefer a human name here
        user_id: me && me.startsWith("+") ? me : null, // optional if you type a phone
        customer_impact: ci,
        team_energy: te,
        frequency: fr,
        ease: ea,
      });
      onCreated?.();
      onClose?.();
    } catch (e) {
      alert(`Add failed: ${e.message}`);
    } finally {
      setBusy(false);
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
        <div className="title">New item</div>
        <button className="icon" onClick={onClose}>✕</button>
      </div>

      <div className="field">
        <label>Story / title</label>
        <textarea
          rows={4}
          placeholder="What did you notice?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <Slider label="Customer impact" value={ci} setValue={setCi} />
      <Slider label="Team energy" value={te} setValue={setTe} />
      <Slider label="Frequency" value={fr} setValue={setFr} />
      <Slider label="Ease" value={ea} setValue={setEa} />

      <div className="actions">
        <button className="ghost" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={!canSave || busy} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
