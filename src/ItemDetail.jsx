// src/ItemDetail.jsx
import { TEXT, formatDate, isMine } from "./logic.js";

export default function ItemDetail({ item, me, onClose }) {
  const ownerName = item?.owner_name || item?.user_id || "—";
  const mine = isMine(item, me);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        background: "#0a2a44",
        color: "white",
        borderLeft: "1px solid rgba(255,255,255,0.1)",
        padding: 16,
        overflowY: "auto",
        boxShadow: "-12px 0 32px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#ffd666" }}>
          {item?.content || item?.transcript || "Untitled"}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.10)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 12,
            padding: "6px 10px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Fields (order requested) */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 10 }}>
        <div style={{ opacity: 0.7 }}> {TEXT.chips.originator} </div>
        <div style={{ color: mine ? "#ff89c3" : "white" }}>{ownerName}</div>

        <div style={{ opacity: 0.7 }}> {TEXT.chips.tier} </div>
        <div>{item?.action_tier || "—"}</div>

        <div style={{ opacity: 0.7 }}> {TEXT.chips.rank} </div>
        <div>{Number(item?.priority_rank || 0)}</div>

        <div style={{ opacity: 0.7 }}> {TEXT.chips.leader} </div>
        <div>{item?.leader_to_unblock ? "Yes" : "—"}</div>

        <div style={{ opacity: 0.7 }}> Organisation </div>
        <div>{TEXT.orgName}</div>

        <div style={{ opacity: 0.7 }}> Created </div>
        <div>{formatDate(item?.created_at)}</div>

        <div style={{ opacity: 0.7 }}> Response </div>
        <div>{item?.response || "—"}</div>
      </div>
    </div>
  );
}
