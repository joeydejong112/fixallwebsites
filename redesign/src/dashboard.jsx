// ScanPulse — Screen 2: Dashboard Overview
// Hero panel (score ring + pillar bars) · Quick Wins · Trend chart · Recent scans

function DashboardScreen({ onGo }) {
  return (
    <main style={{ flex: 1, padding: "32px 40px 60px", background: "var(--canvas)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }} className="grid-bg" />
      <div style={{ position: "absolute", top: -100, right: -100, width: 600, height: 600, background: "radial-gradient(circle, rgba(236, 53, 134, 0.08), transparent 60%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
        <DashboardHeader />
        <HeroScanPanel onGo={onGo} />
        <QuickWinsRow onGo={onGo} />
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          <TrendChart />
          <MonitorPanel />
        </div>
        <RecentScansTable onGo={onGo} />
      </div>
    </main>
  );
}

function DashboardHeader() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div className="eyebrow">Overview · April 18</div>
        <h1 className="display" style={{ fontSize: 44, margin: "14px 0 0" }}>Good morning, Kira.</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, margin: "8px 0 0" }}>
          3 sites are monitored. 1 regressed overnight. <a style={{ color: "var(--brand)", cursor: "pointer" }}>Review →</a>
        </p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>New scan</button>
        <button className="btn btn-ghost">Bulk upload</button>
        <button className="btn btn-primary">Export report <Arrow size={13}/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero — the last-scanned site (score ring + pillar breakdown)
function HeroScanPanel({ onGo }) {
  return (
    <div className="card" style={{ padding: "32px 36px", position: "relative" }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--brand), transparent)" }} />
      <div className="ghost-numeral" style={{ fontSize: 260, top: -30, right: 20, color: "rgba(236, 53, 134, 0.05)" }}>74</div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 48, alignItems: "center", position: "relative" }}>
        {/* Ring */}
        <div>
          <ScoreRing score={74} delta="+6" />
        </div>

        {/* Pillar breakdown */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <Favicon host="acme.design" size={32} bg="#ec3586" />
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "#fff", marginBottom: 2 }}>acme.design</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Last scanned 12m ago · <a style={{ color: "var(--brand)", cursor: "pointer" }}>View full report →</a></div>
            </div>
            <span className="chip" style={{ marginLeft: "auto", borderColor: "rgba(0, 212, 170, 0.3)", background: "rgba(0, 212, 170, 0.1)", color: "var(--p-security)" }}>
              <span className="pulse-dot" style={{ background: "var(--p-security)", color: "var(--p-security)" }} />
              Monitoring on
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px" }}>
            {PILLARS.map(p => (
              <div key={p.key} style={{ display: "grid", gridTemplateColumns: "110px 1fr 34px", gap: 12, alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: p.color, fontWeight: 600 }}>
                  {p.label}
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${p.score}%`,
                    background: p.color,
                    boxShadow: `0 0 10px ${p.color}55`,
                    borderRadius: 999,
                    transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }} />
                </div>
                <div className="num" style={{ fontSize: 14, color: "#fff", textAlign: "right" }}>{p.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
          <button className="btn btn-pink-ghost" style={{ justifyContent: "center", height: 40 }}>
            Rescan site
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: "center", height: 40 }} onClick={() => onGo("result")}>
            See all 94 checks <Arrow size={13}/>
          </button>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Potential uplift</div>
            <div className="num" style={{ fontSize: 28, color: "var(--p-security)" }}>+28 pts</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>by fixing 3 quick wins</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick Wins — THE feature
function QuickWinsRow({ onGo }) {
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div className="eyebrow">Quick wins · ranked by score impact</div>
          <h2 className="display" style={{ fontSize: 28, margin: "10px 0 0" }}>Fix three things. Unlock 28 points.</h2>
        </div>
        <a style={{ color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display)" }}>
          Show all issues →
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {QUICK_WINS.map((q, i) => (
          <QuickWinCard key={i} q={q} onGo={onGo} />
        ))}
      </div>
    </section>
  );
}

function QuickWinCard({ q, onGo }) {
  const p = PILLARS.find(x => x.key === q.pillar);
  return (
    <div className="card lift" style={{
      padding: "24px 24px 22px",
      position: "relative",
      borderLeft: `2px solid ${p.color}`,
      minHeight: 220,
      cursor: "pointer",
    }}
      onClick={() => onGo(q.tool === "csp" ? "csp" : "tools")}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 30px ${p.color}25`; e.currentTarget.style.borderColor = `${p.color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderLeftColor = p.color; e.currentTarget.style.borderTopColor = "var(--border)"; e.currentTarget.style.borderRightColor = "var(--border)"; e.currentTarget.style.borderBottomColor = "var(--border)"; }}
    >
      <div className="card-accent-top" style={{ background: `linear-gradient(to right, ${p.color}, transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span className="eyebrow-pillar" style={{ color: p.color }}>
          <span style={{ width: 22, height: 2, background: p.color, display: "inline-block", marginRight: 6 }} />
          {p.label}
        </span>
        <div style={{ textAlign: "right" }}>
          <div className="num" style={{ fontSize: 26, color: "var(--p-security)", lineHeight: 1 }}>+{q.impact}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>pts potential</div>
        </div>
      </div>

      <h3 className="display" style={{ fontSize: 20, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{q.title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 20px" }}>{q.blurb}</p>

      <button className="btn btn-pink-ghost" style={{ width: "100%", justifyContent: "center" }}>
        {q.toolLabel} <Arrow size={13}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Trend chart — line with pink gradient fill
function TrendChart() {
  const points = [
    { x: 0,  acme: 52, proto: 80 },
    { x: 1,  acme: 55, proto: 82 },
    { x: 2,  acme: 58, proto: 83 },
    { x: 3,  acme: 62, proto: 85 },
    { x: 4,  acme: 60, proto: 84 },
    { x: 5,  acme: 65, proto: 86 },
    { x: 6,  acme: 68, proto: 87 },
    { x: 7,  acme: 68, proto: 88 },
    { x: 8,  acme: 70, proto: 88 },
    { x: 9,  acme: 72, proto: 90 },
    { x: 10, acme: 73, proto: 91 },
    { x: 11, acme: 74, proto: 88 },
  ];

  const W = 640, H = 260, pad = 32;
  const xScale = (x) => pad + (x / 11) * (W - pad * 2);
  const yScale = (y) => pad + (1 - (y - 40) / 60) * (H - pad * 2 - 20);

  const linePath = (key) => points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x)},${yScale(p[key])}`).join(" ");
  const areaPath = `${linePath("acme")} L${xScale(11)},${H - pad} L${xScale(0)},${H - pad} Z`;

  return (
    <div className="card" style={{ padding: 28, position: "relative", height: 340 }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--brand), transparent)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div className="eyebrow">Score history · 12 weeks</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14 }}>
            <div className="num" style={{ fontSize: 44 }}>74</div>
            <div style={{ color: "var(--p-security)", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>+22 since start</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <LegendDot color="#ec3586" label="acme.design" />
          <LegendDot color="rgba(255,255,255,0.35)" label="proto.studio" />
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec3586" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ec3586" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {[50, 60, 70, 80, 90].map(v => (
          <g key={v}>
            <line x1={pad} x2={W - pad} y1={yScale(v)} y2={yScale(v)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
            <text x={8} y={yScale(v) + 3} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="var(--font-mono)">{v}</text>
          </g>
        ))}
        {/* proto (ghost) */}
        <path d={linePath("proto")} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* acme area */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* acme line */}
        <path d={linePath("acme")} fill="none" stroke="#ec3586" strokeWidth="2.2" />
        {/* last point */}
        <circle cx={xScale(11)} cy={yScale(74)} r="5" fill="#ec3586" />
        <circle cx={xScale(11)} cy={yScale(74)} r="10" fill="#ec3586" opacity="0.2" />
      </svg>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
      <span style={{ width: 12, height: 2, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Monitor Panel — live status
function MonitorPanel() {
  const events = [
    { when: "04:12", host: "harbor.build",    msg: "HSTS header restored",             status: "pass", pillar: "security" },
    { when: "03:57", host: "acme.design",     msg: "New scan completed",                status: "pass", pillar: "performance" },
    { when: "02:21", host: "lumen.co",        msg: "LCP regressed to 4.1s",              status: "warn", pillar: "performance" },
    { when: "01:03", host: "lumen.co",        msg: "CSP header removed on /pricing",     status: "crit", pillar: "security" },
    { when: "00:44", host: "proto.studio",    msg: "Weekly scan scheduled",              status: "pass", pillar: "dns" },
  ];
  return (
    <div className="card" style={{ padding: 28, position: "relative", height: 340, overflow: "hidden" }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, #74b9ff, transparent)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div className="eyebrow">Monitoring</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginTop: 12 }}>Last 24 hours</div>
        </div>
        <span className="chip" style={{ borderColor: "rgba(0, 212, 170, 0.3)", background: "rgba(0, 212, 170, 0.1)", color: "var(--p-security)" }}>
          <span className="pulse-dot" style={{ background: "var(--p-security)", color: "var(--p-security)" }} />
          Live
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {events.map((e, i) => {
          const p = PILLARS.find(x => x.key === e.pillar);
          return (
            <div key={i} style={{
              padding: "12px 0 12px 14px",
              borderLeft: `2px solid ${e.status === "crit" ? "#ff4757" : e.status === "warn" ? "#ffaa00" : p.color}`,
              borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none",
              display: "grid",
              gridTemplateColumns: "48px 1fr auto",
              gap: 12,
              alignItems: "center",
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{e.when}</span>
              <div>
                <div style={{ fontSize: 13, color: "#fff", marginBottom: 2 }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{e.host}</span>
                  <span style={{ color: "var(--text-muted)" }}> · {e.msg}</span>
                </div>
              </div>
              <StatusIcon status={e.status} size={14} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent scans table
function RecentScansTable({ onGo }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="eyebrow">Recent scans</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" style={{ height: 32, fontSize: 12, padding: "0 12px" }}>Filter</button>
          <button className="btn btn-ghost" style={{ height: 32, fontSize: 12, padding: "0 12px" }}>Export CSV</button>
        </div>
      </div>

      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.4fr 0.8fr 1.8fr 1fr 0.7fr",
          padding: "12px 28px",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          borderBottom: "1px solid var(--border)",
        }}>
          <div>Site</div>
          <div>Score</div>
          <div>Pillars (SEC · PERF · SEO · A11Y · AI · DNS · TRUST)</div>
          <div>When</div>
          <div />
        </div>
        {RECENT.map((r, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "2.4fr 0.8fr 1.8fr 1fr 0.7fr",
            padding: "16px 28px",
            alignItems: "center",
            borderBottom: i < RECENT.length - 1 ? "1px solid var(--border)" : "none",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onClick={() => onGo("result")}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Favicon host={r.host} size={28} />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#fff" }}>{r.host}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{r.delta.startsWith("+") ? <span style={{ color: "#00d4aa" }}>▲ {r.delta.slice(1)}</span> : <span style={{ color: "#ff4757" }}>▼ {r.delta.slice(1)}</span>} since last scan</div>
              </div>
            </div>
            <div><ScoreChip score={r.overall} /></div>
            <div><PillarSparkline values={r.pillars} /></div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.when}</div>
            <div style={{ textAlign: "right", color: "var(--text-muted)" }}><Arrow size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
