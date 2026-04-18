// ScanPulse — Primitives
// ScoreRing, PillarIcon, StatusIcon, PillarChip, Favicon, Sparkline

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// ScoreRing — animated circular score with gradient stroke
function ScoreRing({ score = 74, size = 220, stroke = 14, color = "#ec3586", label = "Overall", delta = null }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (animated / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#grad-${label})`}
          strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2,
      }}>
        <div className="num" style={{ fontSize: size * 0.36, lineHeight: 1, color: "#fff" }}>
          {Math.round(animated)}
        </div>
        <div className="eyebrow" style={{ marginTop: 8, fontSize: 10, letterSpacing: "0.22em" }}>
          {label}
        </div>
        {delta && (
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 12, fontWeight: 600,
            color: delta.startsWith("+") ? "#00d4aa" : "#ff4757",
            marginTop: 6,
          }}>
            {delta} since last scan
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PillarIcon — minimal line glyphs, no emoji
function PillarIcon({ name, size = 18, color = "currentColor", stroke = 1.6 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "shield":
      return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>;
    case "zap":
      return <svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>;
    case "search":
      return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>;
    case "a11y":
      return <svg {...p}><circle cx="12" cy="5" r="2"/><path d="M5 9h14M12 9v6M9 21l3-6 3 6"/></svg>;
    case "spark":
      return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case "globe":
      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></svg>;
    case "heart":
      return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// ─────────────────────────────────────────────────────────────
// StatusIcon — pass/warn/crit glyphs (no emoji)
function StatusIcon({ status, size = 18 }) {
  const color = status === "pass" ? "#00d4aa" : status === "warn" ? "#ffaa00" : "#ff4757";
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (status === "pass") return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
  if (status === "warn") return <svg {...p}><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/></svg>;
}

// ─────────────────────────────────────────────────────────────
// PillarChip — small colored dot + label chip
function PillarChip({ pillar, compact = false }) {
  const p = PILLARS.find(x => x.key === pillar);
  if (!p) return null;
  return (
    <span className="chip" style={{
      borderColor: `${p.color}33`,
      background: `${p.color}12`,
      color: p.color,
    }}>
      <span className="dot" style={{ background: p.color }} />
      {compact ? p.label.split(" ")[0] : p.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusChip
function StatusChip({ status }) {
  const map = {
    pass: { c: "#00d4aa", t: "Pass" },
    warn: { c: "#ffaa00", t: "Warning" },
    crit: { c: "#ff4757", t: "Critical" },
  };
  const s = map[status];
  return (
    <span className="chip" style={{
      borderColor: `${s.c}40`,
      background: `${s.c}14`,
      color: s.c,
    }}>
      <span className="dot" style={{ background: s.c }} />
      {s.t}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Favicon — colored rounded square with initial
function Favicon({ host, size = 24, bg = null }) {
  const initial = host.replace(/^www\./, "")[0].toUpperCase();
  // Deterministic color from host
  const colors = ["#ec3586", "#00d4aa", "#ffaa00", "#6c5ce7", "#74b9ff", "#fd79a8", "#ff7675"];
  const h = host.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = bg || colors[h % colors.length];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: size * 0.5,
      color: "#fff",
      letterSpacing: "-0.04em",
      flexShrink: 0,
    }}>{initial}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline — 7 colored micro bars for pillar breakdown
function PillarSparkline({ values }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 5,
          height: `${Math.max(15, v) * 0.22}px`,
          background: PILLARS[i].color,
          borderRadius: 1,
          opacity: 0.9,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Score chip (small overall score badge, colored by range)
function ScoreChip({ score }) {
  const c = score >= 85 ? "#00d4aa" : score >= 65 ? "#ffaa00" : "#ff4757";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 6,
      background: `${c}14`, color: c,
      border: `1px solid ${c}30`,
      fontFamily: "var(--font-display)",
      fontWeight: 700, fontSize: 13,
      fontVariantNumeric: "tabular-nums",
    }}>{score}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Arrow (reusable inline arrow for CTAs)
function Arrow({ size = 14, stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

Object.assign(window, {
  ScoreRing, PillarIcon, StatusIcon, PillarChip, StatusChip, Favicon, PillarSparkline, ScoreChip, Arrow
});
