import React from "react";
import { COPY, ORG_NAME } from "./copy.js";

const row = { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, margin: "6px 0" };
const label = { color: "#9FB3C8", fontSize: 12, alignSelf: "center" };
const val = { color: "#D6E2F0", fontSize: 14 };

export default function ItemDetail({ item, onClose, displayOwner, fmtDate, tierLabel, org }) {
  const orgName = org || ORG_NAME;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{ margin: 0, color: "#F4D35E" }}>{item?.content || item?.item_title || "Untitled"}</h3>
        <button
          style={{
            background: "#0F2E4F",
            color: "#D6E2F0",
            border: "1px solid #264868",
            borderRadius: 10,
            padding: "6px 10px",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div style={row}>
        <div style={label}>{COPY.detail.organisation}</div>
        <div style={val}>{orgName}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.created}</div>
        <div style={val}>{fmtDate(item?.created_at)}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.rank}</div>
        <div style={val}>{Number(item?.rank ?? item?.priority_rank ?? 0)}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.tier}</div>
        <div style={val}>{tierLabel(item)}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.type}</div>
        <div style={val}>{item?.item_type || "frustration"}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.leader}</div>
        <div style={val}>{item?.leader_to_unblock ? "Yes" : "No"}</div>
      </div>

      <div style={row}>
        <div style={label}>{COPY.detail.owner}</div>
        <div style={val}>{displayOwner(item) || "—"}</div>
      </div>

      {item?.response ? (
        <>
          <div style={{ height: 12 }} />
          <div style={{ ...label, marginBottom: 4 }}>{COPY.detail.response}</div>
          <div style={{ ...val, whiteSpace: "pre-wrap" }}>{item.response}</div>
        </>
      ) : null}
    </div>
  );
}
