import React from "react";
import "./App.css";

const first = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== "");

export default function ItemDetail({ item, onClose }) {
  const title =
    first(item.item_title, item.content, item.transcript, item.story_json?.title) || "Untitled";
  const content =
    first(item.content, item.transcript, item.story_json?.content, item.story_json?.body) || "";
  const created =
    first(item.created_at, item.created, item.updated_at, item.updated) || new Date().toISOString();

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h3 className="drawer-title">{title}</h3>
          <button className="icon" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="kv">
          <div><span>Created</span><b>{String(created).slice(0, 16).replace("T", " ")}</b></div>
          <div><span>Rank</span><b>{first(item.rank, item.priority_rank, 0)}</b></div>
          <div><span>Tier</span><b>{first(item.tier, item.tier_name, "—")}</b></div>
          <div><span>Owner</span><b>{first(item.originator_name, item.user_name, item.user_id, "—")}</b></div>
          <div><span>Type</span><b>{first(item.item_type, item.type, "—")}</b></div>
        </div>

        {!!content && (
          <>
            <h4 className="section">Story</h4>
            <p className="body">{content}</p>
          </>
        )}

        {!!item.response && (
          <>
            <h4 className="section">Response</h4>
            <p className="body">{item.response}</p>
          </>
        )}
      </aside>
    </div>
  );
}
