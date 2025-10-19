import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ========================
// 1) SUPABASE CLIENT
//    Paste YOUR values:
// ========================
const SUPABASE_URL = "https://ryverzivsojfgtynsqux.supabase.co"; // <-- PASTE YOUR VALUES
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmVyeml2c29qZmd0eW5zcXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzA3MTcsImV4cCI6MjA3NTg0NjcxN30.a7FxSQgHHcuvixFakIw9ObQI7_hBSYp8IaJFD1Ma7Uw";        // <-- PASTE YOUR VALUES
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================
// THEME (your palette)
// ========================
const C = {
  blueDark: "#005E87",
  yellow: "#FDC732",
  berry: "#D42956",    // used only to highlight *current user* originator
  blueLight: "#2CD0D7",
  textDark: "#212121",
  card: "#FFFFFF",
  bg: "#0F1418",       // very dark background
  border: "rgba(255,255,255,0.12)",
};

const API_BASE = "https://felma-backend.onrender.com";

// Simple date formatter
const fmt = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso ?? "";
  }
};

// Make a short display name from email
const displayFromEmail = (email) =>
  email ? email.split("@")[0] : "anonymous";

// ========================
// APP
// ========================
export default function App() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");

  // auth
  const [user, setUser] = useState(null);
  const userDisplay = useMemo(
    () => (user?.user_metadata?.full_name || displayFromEmail(user?.email || "")),
    [user]
  );

  // ------------------------
  // Auth bootstrap & session
  // ------------------------
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Listen for login/logout
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session2) => {
        setUser(session2?.user || null);
      });
      return () => subscription.unsubscribe();
    })();
  }, []);

  // ------------------------
  // Fetch list
  // ------------------------
  async function loadList() {
    setLoadingList(true);
    setNotice("");
    try {
      const res = await fetch(`${API_BASE}/api/list`, { credentials: "omit" });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotice("Could not load notes: " + e.message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  // ------------------------
  // Save new note
  // ------------------------
  async function onSave() {
    const content = text.trim();
    if (!content) return;

    setSaving(true);
    setNotice("");
    try {
      // We send `user_id` and `originator_name` along.
      // If the backend already accepts these (recommended), they’ll be stored.
      // If not, the backend will simply ignore the extra keys.
      const body = {
        content,
        item_type: "frustration",
        user_id: user?.id ?? null,
        originator_name: userDisplay || null,
        item_title: content, // title mirrors content for now
      };

      const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await safeError(res);
        throw new Error(msg || `Save failed (${res.status})`);
      }

      setText("");
      await loadList();
      setNotice("Saved ✓");
      setTimeout(() => setNotice(""), 1500);
    } catch (e) {
      setNotice(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ------------------------
  // Magic link sign-in
  // ------------------------
  async function sendMagicLink(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    if (!email) return;

    setNotice("Sending magic link…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://felma-ui.onrender.com",
      },
    });
    if (error) {
      setNotice("Sign-in failed: " + error.message);
    } else {
      setNotice("Check your email for the sign-in link.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setNotice("Signed out");
    setTimeout(() => setNotice(""), 1200);
  }

  return (
    <div style={styles.page}>
      <style>{globalStyles}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Felma — Open Notes</div>

        <div style={styles.authBox}>
          {user ? (
            <div style={styles.authRow}>
              <span style={styles.meTag}>Signed in:</span>
              <span style={styles.meName}>{userDisplay}</span>
              <button style={styles.authBtn} onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <form style={styles.authRow} onSubmit={sendMagicLink}>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                style={styles.emailInput}
                required
              />
              <button style={styles.authBtn} type="submit">Email me a link</button>
            </form>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={styles.card}>
        <div style={styles.sectionLabel}>New</div>
        <textarea
          placeholder="Type a quick note…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.row}>
          <button
            style={styles.saveBtn}
            disabled={saving || !text.trim()}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {notice && <span style={styles.notice}>{notice}</span>}
        </div>
      </div>

      {/* List */}
      <div style={{ marginTop: 16 }}>
        {loadingList ? (
          <div style={styles.loading}>Loading…</div>
        ) : (
          items.map((it) => (
            <ItemCard
              key={it.id}
              it={it}
              me={userDisplay}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ------------------------
// Item Card
// ------------------------
function ItemCard({ it, me }) {
  const isMine =
    !!me &&
    (eq(it?.originator_name, me) ||
      eq(it?.user_id, undefined) ? false : false); // safe default
  // we still highlight by originator_name when available
  const mine = !!me && eq(it?.originator_name, me);

  return (
    <div style={styles.item}>
      {/* Top badges */}
      <div style={styles.badgeRow}>
        <span style={styles.pillType}>{cap(it?.item_type || "frustration")}</span>
        {it?.priority_rank != null && (
          <span style={styles.pillMeta}>rank: {it.priority_rank}</span>
        )}
        {it?.tier && <span style={styles.pillMeta}>tier: {it.tier}</span>}
      </div>

      {/* Title / content */}
      <div style={styles.titleRow}>
        <span style={styles.itemTitle}>
          {it?.item_title?.trim?.() || it?.content?.trim?.() || "(untitled)"}
        </span>
      </div>

      {/* Meta line */}
      <div style={styles.metaRow}>
        <span style={styles.metaPill}>{fmt(it?.created_at)}</span>
        <span style={styles.metaPill}>org: {it?.org_slug || "demo"}</span>
        <span style={styles.metaPill}>team: {it?.team_id ? String(it.team_id) : "—"}</span>
        {/* Originator */}
        <span
          style={{
            ...styles.metaPill,
            ...(mine ? styles.originatorMine : styles.originatorOther),
          }}
          title={it?.originator_name || ""}
        >
          by {it?.originator_name || "—"}
        </span>
      </div>
    </div>
  );
}

// ------------------------
// Utils & styles
// ------------------------
function eq(a, b) {
  if (a == null || b == null) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function safeError(res) {
  try {
    const t = await res.text();
    try {
      const j = JSON.parse(t);
      return j?.error || j?.message || t;
    } catch {
      return t;
    }
  } catch {
    return "";
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    color: "#FFF",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: 680,
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  authBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  authRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  emailInput: {
    height: 34,
    borderRadius: 8,
    padding: "0 10px",
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: "#fff",
  },
  authBtn: {
    background: C.blueDark,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  meTag: { opacity: 0.7 },
  meName: { fontWeight: 600 },

  card: {
    width: 680,
    maxWidth: "100%",
    background: C.blueDark,
    borderRadius: 14,
    padding: 12,
    border: `1px solid ${C.border}`,
  },
  sectionLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 6,
  },
  textarea: {
    width: "100%",
    minHeight: 64,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: 10,
    outline: "none",
  },
  row: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  saveBtn: {
    background: "#1b9e59",
    color: "#fff",
    border: 0,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  notice: { fontSize: 12, opacity: 0.85 },

  loading: { opacity: 0.8, marginTop: 8 },

  item: {
    width: 680,
    maxWidth: "100%",
    background: C.card,
    color: C.textDark,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    border: `1px solid ${C.border}`,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  pillType: {
    background: C.blueDark,
    color: "#fff",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  pillMeta: {
    background: "rgba(0,0,0,0.06)",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
  },
  titleRow: { marginBottom: 6 },
  itemTitle: {
    color: C.yellow,
    fontWeight: 700,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    background: "rgba(0,0,0,0.06)",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
  },
  originatorMine: {
    background: C.berry,
    color: "#fff",
  },
  originatorOther: {
    background: "rgba(0,0,0,0.06)",
  },
};

const globalStyles = `
  * { box-sizing: border-box; }
  body, html, #root { margin: 0; height: 100%; }
`;
