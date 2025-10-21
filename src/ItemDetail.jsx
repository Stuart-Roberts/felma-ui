// src/ItemDetail.jsx
import { TEXT, formatDate, displayOwner, COLOR_LEADER, COLOR_BERRY, isMine } from "./logic.js";

function Row({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center" }}>
      <div style={{ opacity: 0.7 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function ItemDetail({ item, me, onClose }) {
  if (!item) return null;

  const mine = isMine(item, me);
  const owner = displayOwner(item);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 50,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 420,
          background: "#0b2c45",
          color: "white",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0, lineHeight: 1.3, flex: 1 }}>{item?.content || item?.transcript || "Untitled"}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              color: "white",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}>
            RANK {Number(item?.priority_rank || 0)}
          </span>

          {item?.action_tier && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              Tier {item.action_tier}
            </span>
          )}

          {item?.leader_to_unblock && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "rgba(44,208,215,0.16)",
              color: COLOR_LEADER,
              border: "1px solid rgba(44,208,215,0.35)"
            }}>
              Leader to Unblock
            </span>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* Fields in the exact order you requested */}
        <div style={{ display: "grid", gap: 10 }}>
          <Row label="Originator">
            <span style={{ color: mine ? COLOR_BERRY : "inherit", fontWeight: mine ? 700 : 500 }}>
              {owner || "—"}
            </span>
          </Row>

          <Row label="Tier">
            <span>{item?.action_tier || "—"}</span>
          </Row>

          <Row label="Rank">
            <span>{Number(item?.priority_rank || 0)}</span>
          </Row>

          <Row label="Leader to Unblock">
            <span>{item?.leader_to_unblock ? "Yes" : "No"}</span>
          </Row>

          <Row label="Organisation">
            <span>{TEXT.orgName}</span>
          </Row>

          <Row label="Created">
            <span>{formatDate(item?.created_at)}</span>
          </Row>

          <Row label="Response">
            <span style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
              {item?.response || "—"}
            </span>
          </Row>
        </div>
      </aside>
    </div>
  );
}
