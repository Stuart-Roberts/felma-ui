import { useEffect, useMemo, useState } from 'react';

// === CONFIG ===============================================================
const API_BASE = 'https://felma-backend.onrender.com/api';

// Locale-aware date like 20-Oct-'25 (GB) or Oct 20-'25 (US)
function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = d.toLocaleString(undefined, { month: 'short' }); // locale-aware
  const dd = String(d.getDate()).padStart(2, '0');

  // If the locale usually prints month first, do "Oct 20-'25", else "20-Oct-'25"
  const monthFirst = /^en-US|^en-CA|^en-PH|^en-MX/i.test(navigator.language || '');
  return monthFirst ? `${mm} ${dd}-'${yy}` : `${dd}-${mm}-'${yy}`;
}

function TierPill({ rank }) {
  // Simple tiering by rank (keep the existing wording)
  let text = 'WHEN TIME ALLOWS';
  if (rank >= 60) text = '🚀 Move now';
  else if (rank >= 30) text = '➡️ Move it forward';

  return (
    <span
      style={{
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      Tier {text}
    </span>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)',
        marginLeft: 8,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Card({ item, onClick }) {
  const owner = item.owner || item.user_id || '—';
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        borderRadius: 16,
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        cursor: 'pointer',
      }}
    >
      {/* top row: Tier + Rank on ONE line */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: 1.1,
            color: 'rgba(255,255,255,0.65)',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '3px 8px',
            marginRight: 8,
          }}
        >
          RANK {item.rank ?? 0}
        </span>
        <TierPill rank={item.rank ?? 0} />
        {item.leader_to_unblock ? <Badge>Leader to Unblock</Badge> : null}
        {owner && <Badge>Owner: {owner}</Badge>}
      </div>

      {/* Title (yellow) */}
      <div
        style={{
          fontWeight: 700,
          color: '#ffd54f',
          marginBottom: 6,
          fontSize: 16,
          lineHeight: 1.2,
        }}
      >
        {item.title || item.content || 'Untitled'}
      </div>

      {/* Date only (formatted) */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        {formatShortDate(item.created_at)}
      </div>
    </button>
  );
}

function ItemDetail({ item, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_impact: item.customer_impact ?? 0,
    team_energy: item.team_energy ?? 0,
    frequency: item.frequency ?? 0,
    ease: item.ease ?? 0,
    leader_to_unblock: !!item.leader_to_unblock,
  });

  useEffect(() => {
    setForm({
      customer_impact: item.customer_impact ?? 0,
      team_energy: item.team_energy ?? 0,
      frequency: item.frequency ?? 0,
      ease: item.ease ?? 0,
      leader_to_unblock: !!item.leader_to_unblock,
    });
  }, [item.id]);

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json && json.item) onUpdated(json.item);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, value, onInput }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 6, fontSize: 13 }}>{label}: {value}</div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onInput(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );

  const owner = item.owner || item.user_id || '—';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 420,
        maxWidth: '100vw',
        height: '100vh',
        background: '#0f1a22',
        color: 'white',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        padding: 20,
        overflow: 'auto',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#ffd54f', flex: 1 }}>
          {item.title || item.content || 'Untitled'}
        </div>
        <button
          onClick={onClose}
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: 'white',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Created</div>
          <div style={{ fontWeight: 600 }}>{formatShortDate(item.created_at)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Rank</div>
          <div style={{ fontWeight: 600 }}>{item.rank ?? 0}</div>
        </div>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 8, alignItems: 'center' }}>
          <TierPill rank={item.rank ?? 0} />
          {form.leader_to_unblock ? <Badge>Leader to Unblock</Badge> : null}
          <Badge>Owner: {owner}</Badge>
        </div>
      </div>

      {/* 4 sliders */}
      <div style={{ marginBottom: 8, fontWeight: 700 }}>Rate 1–10</div>
      <Row
        label="Customer impact"
        value={form.customer_impact}
        onInput={(v) => onChange('customer_impact', v)}
      />
      <Row label="Team energy" value={form.team_energy} onInput={(v) => onChange('team_energy', v)} />
      <Row label="Frequency" value={form.frequency} onInput={(v) => onChange('frequency', v)} />
      <Row label="Ease" value={form.ease} onInput={(v) => onChange('ease', v)} />

      <div style={{ marginTop: 10 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form.leader_to_unblock}
            onChange={(e) => onChange('leader_to_unblock', e.target.checked)}
          />
          Leader to unblock
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: saving ? 'rgba(255,255,255,0.1)' : 'rgba(76,175,80,0.25)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [orgName, setOrgName] = useState('Felma');
  const [sortKey, setSortKey] = useState('rank_desc');

  const load = async () => {
    const res = await fetch(`${API_BASE}/list`);
    const json = await res.json();
    const rows = json.items || [];

    // normalise needed fields for cards
    const normalised = rows.map((r) => ({
      id: r.id,
      title: r.title || r.content,
      created_at: r.created_at,
      rank: r.priority_rank ?? r.rank ?? 0,
      leader_to_unblock: !!r.leader_to_unblock,
      owner: r.owner || r.user_id || null,
      user_id: r.user_id || null,
      customer_impact: r.customer_impact ?? 0,
      team_energy: r.team_energy ?? 0,
      frequency: r.frequency ?? 0,
      ease: r.ease ?? 0,
      content: r.content,
    }));

    setItems(normalised);
    // org name from first row if present
    const inferred = json.org || rows[0]?.org_slug || 'Felma';
    setOrgName(String(inferred).toUpperCase());
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sortKey === 'rank_desc') copy.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
    if (sortKey === 'rank_asc') copy.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    if (sortKey === 'newest') copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return copy;
  }, [items, sortKey]);

  const onUpdated = (updated) => {
    setItems((cur) =>
      cur.map((it) => (it.id === updated.id
        ? {
            ...it,
            ...updated,
            rank: updated.priority_rank ?? updated.rank ?? it.rank ?? 0,
          }
        : it))
    );
    setSelected((sel) => (sel?.id === updated.id ? { ...sel, ...updated } : sel));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B141A', color: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{orgName}</div>
          <div style={{ opacity: 0.6 }}>Felma</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <option value="rank_desc">Rank (high → low)</option>
              <option value="rank_asc">Rank (low → high)</option>
              <option value="newest">Newest first</option>
            </select>
            {/* (New button kept, hook up later if needed) */}
            <button
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                borderRadius: 8,
                padding: '6px 12px',
              }}
              onClick={() => alert('Add form can be wired next.')}
            >
              + New
            </button>
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          {sorted.map((item) => (
            <Card key={item.id} item={item} onClick={() => setSelected(item)} />
          ))}
        </div>
      </div>

      {selected && (
        <ItemDetail
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
