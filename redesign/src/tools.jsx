// ScanPulse — Screen 4: Tools Index
// Filter tabs · grid of 10 tool cards, colored top accent by pillar

function ToolsScreen({ onGo }) {
  const [active, setActive] = useState("all");

  const counts = PILLARS.reduce((acc, p) => {
    acc[p.key] = TOOLS.filter(t => t.pillar === p.key).length;
    return acc;
  }, {});

  const filtered = active === "all" ? TOOLS : TOOLS.filter(t => t.pillar === active);

  return (
    <main style={{ flex: 1, padding: "32px 40px 80px", background: "var(--canvas)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.4 }} className="grid-bg" />
      <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(108, 92, 231, 0.08), transparent 60%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div className="eyebrow">Tools · the fix library</div>
          <h1 className="display" style={{ fontSize: 56, margin: "16px 0 10px" }}>
            Ten tools. One job: <span style={{ color: "var(--brand)" }}>close the loop.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", maxWidth: 640, lineHeight: 1.6 }}>
            Every tool generates a fix file you paste into your stack, then rescans to verify. Each shows the exact score uplift it'll produce.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "4px 0", borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
          <TabBtn active={active === "all"} onClick={() => setActive("all")} label={`All tools`} count={TOOLS.length} color="#fff" />
          {PILLARS.filter(p => counts[p.key] > 0).map(p => (
            <TabBtn key={p.key} active={active === p.key} onClick={() => setActive(p.key)} label={p.label} count={counts[p.key]} color={p.color} />
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {filtered.map(t => <ToolCard key={t.id} t={t} onGo={onGo} />)}
        </div>

        {/* Roadmap strip */}
        <div style={{
          marginTop: 20,
          padding: "24px 28px",
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div className="eyebrow">Shipping next</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, marginTop: 8 }}>Cookie Policy Builder · Sitemap Diff · Core Web Vitals Fixer</div>
          </div>
          <a style={{ color: "var(--brand)", fontFamily: "var(--font-display)", fontSize: 13, cursor: "pointer" }}>Vote on next tools →</a>
        </div>
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, label, count, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 14px",
      borderRadius: 8,
      border: `1px solid ${active ? color : "transparent"}`,
      background: active ? `${color}14` : "transparent",
      color: active ? color : "var(--text-muted)",
      fontFamily: "var(--font-display)",
      fontSize: 13, fontWeight: 600,
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {label}
      <span style={{
        padding: "1px 7px",
        borderRadius: 999,
        background: active ? `${color}22` : "rgba(255,255,255,0.05)",
        color: active ? color : "var(--text-faint)",
        fontSize: 11,
        fontVariantNumeric: "tabular-nums",
      }}>{count}</span>
    </button>
  );
}

function ToolCard({ t, onGo }) {
  const p = PILLARS.find(x => x.key === t.pillar);
  const isCSP = t.id === "csp";
  const [hover, setHover] = useState(false);

  return (
    <div className="card lift" style={{
      padding: "26px 24px 22px",
      position: "relative",
      minHeight: 210,
      cursor: "pointer",
      boxShadow: hover ? `0 0 30px ${p.color}30` : "none",
      borderColor: hover ? `${p.color}35` : "var(--border)",
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => isCSP && onGo("csp")}
    >
      <div className="card-accent-top" style={{
        background: p.color,
        height: hover ? 3 : 2,
        transition: "height 0.2s",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 42, height: 42,
          borderRadius: 10,
          background: `${p.color}1f`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: p.color,
        }}>
          <PillarIcon name={p.icon} size={20} stroke={1.8} />
        </div>
        <div>
          <span className="eyebrow-pillar" style={{ color: p.color, fontSize: 10 }}>
            {p.label}
          </span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{t.kind}</div>
        </div>
      </div>

      <h3 className="display" style={{ fontSize: 22, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{t.name}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 18px" }}>{t.blurb}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          padding: "4px 10px",
          borderRadius: 999,
          background: `${p.color}14`,
          color: p.color,
          fontFamily: "var(--font-display)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}>
          Fixes {t.fixes} {t.fixes === 1 ? "issue" : "issues"}
        </span>
        <a style={{ color: hover ? p.color : "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}>
          Open <Arrow size={12}/>
        </a>
      </div>
    </div>
  );
}

Object.assign(window, { ToolsScreen });
