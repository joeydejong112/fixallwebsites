// ScanPulse — App Shell
// Rail nav (left 56px) + Top strip + outlet for screens

const SCREENS = [
  { key: "landing",   label: "Landing",       icon: "home"    },
  { key: "dashboard", label: "Dashboard",     icon: "grid"    },
  { key: "result",    label: "Scan Result",   icon: "doc"     },
  { key: "tools",     label: "Tools",         icon: "wrench"  },
  { key: "csp",       label: "CSP Builder",   icon: "code"    },
];

function RailIcon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":   return <svg {...p}><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-9z"/></svg>;
    case "grid":   return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "doc":    return <svg {...p}><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v6h6M8 14h8M8 18h6"/></svg>;
    case "wrench": return <svg {...p}><path d="M14 6a4 4 0 105 5l3 3-3 3-3-3a4 4 0 01-5-5L4 4l3-3 7 5z"/></svg>;
    case "code":   return <svg {...p}><path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/></svg>;
    case "monitor":return <svg {...p}><path d="M3 5h18v12H3zM8 21h8M12 17v4"/></svg>;
    case "settings":return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

// Logo — the pink pulse glyph
function Logo({ size = 22 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#ec3586" strokeWidth="1.6" />
        <path d="M3 12h4l2-5 3 10 2-6 2 3h5" stroke="#ec3586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.78,
        letterSpacing: "-0.04em",
      }}>scanpulse</span>
    </div>
  );
}

// Left 56px rail (used on all app screens, not landing)
function Rail({ current, onGo }) {
  return (
    <aside style={{
      width: 56,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 18,
      gap: 4,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      zIndex: 10,
    }}>
      <div style={{ marginBottom: 24 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#ec3586" strokeWidth="1.6" />
          <path d="M3 12h4l2-5 3 10 2-6 2 3h5" stroke="#ec3586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {SCREENS.slice(1).map(s => {
        const active = current === s.key;
        return (
          <button key={s.key}
            onClick={() => onGo(s.key)}
            title={s.label}
            style={{
              width: 40, height: 40,
              border: "none",
              background: active ? "var(--brand-soft)" : "transparent",
              color: active ? "var(--brand)" : "rgba(255,255,255,0.55)",
              borderRadius: 9,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            {active && <span style={{ position: "absolute", left: -1, top: 8, bottom: 8, width: 2, background: "var(--brand)", borderRadius: 2 }} />}
            <RailIcon name={s.icon} />
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button style={{
        width: 40, height: 40, border: "none", background: "transparent",
        color: "rgba(255,255,255,0.55)", borderRadius: 9, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }} title="Settings">
        <RailIcon name="settings" />
      </button>
      <div style={{ marginBottom: 14, marginTop: 6,
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #ec3586, #6c5ce7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "#fff",
      }}>KM</div>
    </aside>
  );
}

// Top strip with scan input
function TopStrip({ current }) {
  return (
    <header style={{
      height: 60,
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 20,
      position: "sticky",
      top: 0,
      zIndex: 9,
    }}>
      <Logo size={18} />
      <div style={{ width: 1, height: 22, background: "var(--border)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {current === "dashboard" ? "Dashboard" : current === "result" ? "Scan · acme.design" : current === "tools" ? "Tools" : current === "csp" ? "Tools · CSP Builder" : "—"}
        </span>
      </div>

      <div style={{ flex: 1, maxWidth: 520, marginLeft: 40 }}>
        <div style={{
          height: 38, borderRadius: 9,
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          padding: "0 6px 0 14px",
          gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>
          </svg>
          <input
            defaultValue="https://acme.design"
            style={{
              flex: 1, border: "none", background: "transparent",
              color: "#fff", outline: "none",
              fontFamily: "var(--font-mono)", fontSize: 13,
            }}
          />
          <button className="btn btn-primary" style={{ height: 28, padding: "0 14px", fontSize: 12 }}>Scan</button>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span className="chip" style={{ borderColor: "rgba(236, 53, 134, 0.3)", background: "var(--brand-soft)", color: "var(--brand)" }}>
          <span className="pulse-dot" style={{ background: "var(--brand)", color: "var(--brand)" }} />
          Pro
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--text-muted)" }}>142 / ∞ scans</span>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #ec3586, #6c5ce7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "#fff",
        }}>KM</div>
      </div>
    </header>
  );
}

Object.assign(window, { SCREENS, RailIcon, Logo, Rail, TopStrip });
