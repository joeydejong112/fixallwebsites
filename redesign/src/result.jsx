// ScanPulse — Screen 3: Scan Result detail
// Hero strip · filter toolbar · accordion rows grouped by pillar with colored left rail

function ResultScreen({ onGo }) {
  const [filter, setFilter] = useState("all");
  const [pillarFilter, setPillarFilter] = useState(null);

  return (
    <main style={{ flex: 1, padding: "32px 40px 60px", background: "var(--canvas)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.4 }} className="grid-bg" />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
        <ResultHero />
        <FilterToolbar filter={filter} setFilter={setFilter} pillarFilter={pillarFilter} setPillarFilter={setPillarFilter} />
        <IssueList filter={filter} pillarFilter={pillarFilter} onGo={onGo} />
      </div>
    </main>
  );
}

function ResultHero() {
  const criticals = Object.values(ISSUES).flat().filter(i => i.status === "crit").length;
  const warnings = Object.values(ISSUES).flat().filter(i => i.status === "warn").length;
  const passes = Object.values(ISSUES).flat().filter(i => i.status === "pass").length;

  return (
    <div className="card" style={{ padding: "28px 32px", position: "relative" }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--brand), transparent)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 36, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <ScoreRing score={74} size={140} stroke={10} delta="+6" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Favicon host="acme.design" size={24} bg="#ec3586" />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "#fff" }}>acme.design</div>
            </div>
            <div className="eyebrow" style={{ fontSize: 10 }}>Scanned 12m ago · 94 checks</div>
            <div style={{ marginTop: 16, display: "flex", gap: 18 }}>
              <Stat2 num={criticals} label="Critical" color="#ff4757" />
              <Stat2 num={warnings} label="Warning" color="#ffaa00" />
              <Stat2 num={passes} label="Pass" color="#00d4aa" />
            </div>
          </div>
        </div>

        {/* Pillar score bubbles */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {PILLARS.map(p => (
            <div key={p.key} style={{
              padding: "10px 14px",
              background: `${p.color}10`,
              border: `1px solid ${p.color}26`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              minWidth: 82,
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: p.color, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {p.label.split(" ")[0]}
              </div>
              <div className="num" style={{ fontSize: 22, color: p.color }}>{p.score}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn-primary">Rescan now <Arrow size={13}/></button>
          <button className="btn btn-ghost" style={{ justifyContent: "center" }}>Share report</button>
          <button className="btn btn-ghost" style={{ justifyContent: "center" }}>Export PDF</button>
        </div>
      </div>
    </div>
  );
}

function Stat2({ num, label, color }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 22, color }}>{num}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter toolbar
function FilterToolbar({ filter, setFilter, pillarFilter, setPillarFilter }) {
  const statuses = [
    { key: "all",  label: "All checks" },
    { key: "crit", label: "Critical", color: "#ff4757" },
    { key: "warn", label: "Warning",  color: "#ffaa00" },
    { key: "pass", label: "Pass",     color: "#00d4aa" },
  ];
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
      padding: "16px 20px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      position: "sticky",
      top: 68,
      zIndex: 5,
      backdropFilter: "blur(16px)",
    }}>
      <div style={{ display: "flex", gap: 4 }}>
        {statuses.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            padding: "8px 14px",
            borderRadius: 7,
            border: "none",
            background: filter === s.key ? "var(--elevated-2)" : "transparent",
            color: filter === s.key ? (s.color || "#fff") : "var(--text-muted)",
            fontFamily: "var(--font-display)",
            fontSize: 13, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {s.color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />}
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 20, background: "var(--border)" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
        {PILLARS.map(p => (
          <button key={p.key} onClick={() => setPillarFilter(pillarFilter === p.key ? null : p.key)} style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${pillarFilter === p.key ? p.color : `${p.color}26`}`,
            background: pillarFilter === p.key ? `${p.color}22` : `${p.color}0a`,
            color: p.color,
            fontFamily: "var(--font-display)",
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
            {p.label.split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>94 checks total</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function IssueList({ filter, pillarFilter, onGo }) {
  const activePillars = pillarFilter ? PILLARS.filter(p => p.key === pillarFilter) : PILLARS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {activePillars.map(p => {
        let issues = ISSUES[p.key] || [];
        if (filter !== "all") issues = issues.filter(i => i.status === filter);
        if (!issues.length) return null;
        return <PillarGroup key={p.key} p={p} issues={issues} onGo={onGo} />;
      })}
    </div>
  );
}

function PillarGroup({ p, issues, onGo }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ position: "relative" }}>
      {/* Colored left rail running down the group */}
      <div style={{
        position: "absolute",
        top: 44, bottom: 0,
        left: 0, width: 2,
        background: p.color,
        borderRadius: 2,
        opacity: open ? 0.6 : 0.2,
      }} />

      {/* Group header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px 12px 20px",
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setOpen(!open)} style={{
            width: 22, height: 22,
            border: "none",
            background: "transparent",
            color: p.color,
            cursor: "pointer",
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <span className="eyebrow-pillar" style={{ color: p.color, fontSize: 12 }}>
            <span style={{ width: 28, height: 2, background: p.color, display: "inline-block" }} />
            {p.label}
          </span>
          <div className="num" style={{ fontSize: 22, color: p.color }}>{p.score}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
            {issues.filter(i => i.status === "crit").length} critical · {issues.filter(i => i.status === "warn").length} warning · {issues.filter(i => i.status === "pass").length} pass
          </div>
        </div>
      </div>

      {/* Issue rows */}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 20 }}>
          {issues.map((iss, i) => (
            <IssueRow key={i} iss={iss} pillar={p} onGo={onGo} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ iss, pillar, onGo }) {
  const statusColor = iss.status === "crit" ? "#ff4757" : iss.status === "warn" ? "#ffaa00" : "#00d4aa";
  const statusLabel = iss.status === "crit" ? "CRITICAL" : iss.status === "warn" ? "WARNING" : "PASS";
  const tool = iss.tool ? TOOLS.find(t => t.id === iss.tool) : null;

  return (
    <div className="card lift" style={{
      padding: "18px 22px",
      display: "grid",
      gridTemplateColumns: "110px 1fr auto",
      gap: 20,
      alignItems: "center",
      borderLeft: `2px solid ${statusColor}`,
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusIcon status={iss.status} size={14} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 11,
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: statusColor,
        }}>{statusLabel}</span>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{iss.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{iss.blurb}</div>
      </div>
      <div>
        {tool ? (
          <button className="btn btn-pink-ghost" onClick={() => onGo(tool.id === "csp" ? "csp" : "tools")}>
            Open in {tool.name} <Arrow size={13}/>
          </button>
        ) : iss.status === "pass" ? (
          <span style={{ color: "var(--text-faint)", fontSize: 12, fontFamily: "var(--font-mono)" }}>✓ verified</span>
        ) : (
          <a style={{ color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display)" }}>Learn more →</a>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ResultScreen });
