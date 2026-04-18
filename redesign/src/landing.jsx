// ScanPulse — Screen 1: Landing page
// 7 sections: hero, coverage, how it works, sample result, pricing, testimonials, FAQ

const SECTIONS = [
  { id: "hero",       label: "Hero" },
  { id: "coverage",   label: "Coverage" },
  { id: "how",        label: "How it works" },
  { id: "sample",     label: "Sample result" },
  { id: "pricing",    label: "Pricing" },
  { id: "love",       label: "Testimonials" },
  { id: "faq",        label: "FAQ" },
];

// ─────────────────────────────────────────────────────────────
// Fixed left section-dot nav
function SectionNav({ active, onGo }) {
  return (
    <nav style={{
      position: "fixed",
      left: 36,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      zIndex: 50,
    }}>
      <div style={{
        position: "absolute",
        left: 5, top: -14, bottom: -14,
        width: 2,
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: `${(active + 1) / SECTIONS.length * 100}%`,
          background: "var(--brand)",
          transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 0 10px var(--brand-glow)",
        }} />
      </div>
      {SECTIONS.map((s, i) => (
        <button key={s.id} onClick={() => onGo(i)}
          style={{
            width: 12, height: 12,
            border: "none",
            borderRadius: "50%",
            background: i === active ? "var(--brand)" : "rgba(255,255,255,0.15)",
            cursor: "pointer",
            padding: 0,
            marginLeft: 0,
            transition: "background 0.2s",
            boxShadow: i === active ? "0 0 12px var(--brand-glow)" : "none",
            position: "relative",
            zIndex: 1,
          }}
          title={s.label}
        />
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 1 — Hero
function HeroSection() {
  const [counts, setCounts] = useState({ checks: 0, scans: 0, pillars: 0 });
  useEffect(() => {
    const targets = { checks: 94, scans: 3847, pillars: 7 };
    const dur = 1100;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setCounts({
        checks: Math.round(targets.checks * e),
        scans: Math.round(targets.scans * e),
        pillars: Math.round(targets.pillars * e),
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section style={{
      minHeight: "100vh",
      padding: "90px 80px 60px 140px",
      display: "grid",
      gridTemplateColumns: "44% 56%",
      position: "relative",
      gap: 48,
      alignItems: "center",
    }} className="grid-bg">
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 75% 35%, rgba(236, 53, 134, 0.14), transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <div className="ghost-numeral" style={{ fontSize: 220, top: -40, left: -20 }}>94</div>
        <div className="eyebrow">94 checks · 7 pillars</div>
        <h1 className="display" style={{
          fontSize: "clamp(3.4rem, 5.5vw, 5.6rem)",
          margin: "28px 0 20px",
        }}>
          Every flaw on<br/>your site,<br/>
          <span style={{ color: "var(--brand)" }}>one click</span> from fixed.
        </h1>
        <p style={{
          fontSize: 18,
          color: "var(--text-muted)",
          lineHeight: 1.55,
          maxWidth: 460,
          margin: "0 0 36px",
        }}>
          ScanPulse audits any URL across 94 checks. Each issue links straight to the tool that repairs it — and shows the exact points you'll unlock on your next scan.
        </p>

        <div style={{ display: "flex", gap: 42, marginBottom: 40 }}>
          <Stat num={counts.checks} label="Checks run per scan" />
          <Stat num={counts.pillars} label="Pillars of health" />
          <Stat num={counts.scans.toLocaleString()} label="Scans today" color="var(--brand)" />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 32 }}>
          <button className="btn btn-primary" style={{ height: 48, padding: "0 24px", fontSize: 15 }}>
            Scan your site free <Arrow size={16} />
          </button>
          <button className="btn btn-ghost" style={{ height: 48, padding: "0 20px", fontSize: 14 }}>
            See a sample report
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex" }}>
            {AVATARS.map((a, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: a.c, color: "#fff",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--canvas)",
                marginLeft: i === 0 ? 0 : -10,
              }}>{a.i}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            <strong style={{ color: "#fff", fontFamily: "var(--font-display)" }}>1,284</strong> teams scanning this week
          </div>
        </div>
      </div>

      {/* Right — live feed */}
      <LiveFeedPanel />

      {/* Scroll chevron */}
      <div style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        animation: "chev-bounce 2s infinite ease-in-out",
        color: "var(--text-faint)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </section>
  );
}

function Stat({ num, label, color = "#fff" }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 42, color, marginBottom: 4 }}>{num}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.02em", maxWidth: 110 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Live feed panel (scrolling marquee up)
function LiveFeedPanel() {
  const all = [...FEED, ...FEED, ...FEED]; // triple for seamless loop
  return (
    <div style={{ position: "relative" }}>
      <div className="card" style={{
        padding: 0,
        height: 560,
        overflow: "hidden",
        borderRadius: 20,
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
      }}>
        <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--brand), transparent)" }} />

        {/* header */}
        <div style={{
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pulse-dot" style={{ background: "var(--brand)", color: "var(--brand)" }} />
            <span className="eyebrow" style={{ fontSize: 10 }}>Live feed</span>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#fff", fontWeight: 600 }}>
            <span style={{ color: "var(--brand)" }}>3,847</span> scans today
          </span>
        </div>

        {/* scroll content */}
        <div style={{ height: "calc(100% - 57px)", overflow: "hidden", position: "relative" }}>
          {/* Fade masks */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to bottom, var(--elevated), transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, var(--elevated), transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div style={{
            animation: "marquee-up 28s linear infinite",
          }}>
            {all.map((f, i) => (
              <FeedRow key={i} f={f} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedRow({ f }) {
  const pillar = PILLARS.find(p => p.key === f.pillar);
  const statusColor = f.status === "pass" ? "#00d4aa" : f.status === "warn" ? "#ffaa00" : "#ff4757";
  return (
    <div style={{
      padding: "14px 22px",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 14,
      alignItems: "center",
      borderBottom: "1px solid var(--border)",
      borderLeft: `2px solid ${pillar.color}`,
    }}>
      <Favicon host={f.host} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#fff", marginBottom: 2 }}>{f.host}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ color: pillar.color, fontFamily: "var(--font-display)", fontWeight: 600 }}>{pillar.label}</span>
          {" · "}{f.msg}
        </div>
      </div>
      <StatusIcon status={f.status} size={16} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 2 — Coverage (4x2 bento of pillars)
function CoverageSection() {
  return (
    <section style={{ padding: "120px 80px 120px 140px", position: "relative" }} className="grid-bg">
      <div style={{ maxWidth: 720, marginBottom: 60 }}>
        <div className="eyebrow">Coverage</div>
        <h2 className="display" style={{ fontSize: 64, margin: "20px 0 16px" }}>
          Seven pillars.<br/>
          Ninety-four checks.
        </h2>
        <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.6 }}>
          Every ScanPulse report groups findings into seven canonical pillars. Each pillar owns a color. You'll see that color on the issue, the fix, and the score uplift — a visual map of your site's health.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 20,
      }}>
        {PILLARS.map(p => (
          <PillarBentoCard key={p.key} p={p} />
        ))}
      </div>
    </section>
  );
}

function PillarBentoCard({ p }) {
  const checks = {
    security:      ["HTTPS & HSTS", "CSP present", "Secure cookies", "CORS scoped", "Mixed content"],
    performance:   ["LCP under 2.5s", "CLS under 0.1", "INP under 200ms", "Image formats", "Compression"],
    seo:           ["Canonical", "Open Graph", "JSON-LD", "Meta description", "Sitemap"],
    accessibility: ["Alt text", "Contrast AA", "Landmarks", "Focus states", "Form labels"],
    ai:            ["llms.txt", "Consistent summaries", "Structured data", "Allowed bots", "Entity schema"],
    dns:           ["SPF valid", "DMARC ≥ quarantine", "DKIM aligned", "MX present", "Reverse DNS"],
    trust:         ["Privacy policy", "Terms of service", "Contact page", "Physical address", "Disclosure"],
  };
  return (
    <div className="card lift" style={{ padding: "24px 22px 22px", position: "relative", minHeight: 260 }}>
      <div className="card-accent-top" style={{ background: `linear-gradient(to right, ${p.color}, transparent)` }} />
      <div className="ghost-numeral" style={{ fontSize: 120, top: -10, right: -10, color: `${p.color}12` }}>
        {String(p.count).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: `${p.color}1a`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: p.color,
        }}>
          <PillarIcon name={p.icon} size={18} />
        </div>
        <span className="eyebrow-pillar" style={{ color: p.color }}>
          <span style={{ width: 28, height: 2, background: p.color, display: "inline-block", marginRight: 4 }} />
          {p.label}
        </span>
      </div>
      <div className="num" style={{ fontSize: 40, color: p.color, marginBottom: 14, position: "relative" }}>
        {p.count}<span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 6 }}>checks</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        {checks[p.key].map((c, i) => (
          <li key={i} style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 7"/>
            </svg>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 3 — How it works (diagnose → fix → verify)
function HowSection() {
  const steps = [
    { n: "01", title: "Diagnose", color: "#74b9ff", desc: "Enter a URL. In under 12 seconds, ScanPulse runs 94 checks and assigns an overall score plus seven pillar scores." },
    { n: "02", title: "Fix",      color: "#ec3586", desc: "Every fixable issue links directly to the tool that repairs it — CSP Builder, Image Optimizer, Schema Generator, and eight more." },
    { n: "03", title: "Verify",   color: "#00d4aa", desc: "Rescan. The previously-failing checks turn green. The score ring fills. Monitoring keeps the win in place." },
  ];
  return (
    <section style={{ padding: "120px 80px 120px 140px", position: "relative" }} className="grid-bg">
      <div style={{ maxWidth: 720, marginBottom: 72 }}>
        <div className="eyebrow">The loop</div>
        <h2 className="display" style={{ fontSize: 64, margin: "20px 0 16px" }}>
          Diagnose. Fix. Verify.
        </h2>
        <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          Most tools stop at the report. ScanPulse closes the loop.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {steps.map((s, i) => (
          <div key={i} className="card lift" style={{ padding: "32px 28px", position: "relative", minHeight: 280 }}>
            <div className="card-accent-top" style={{ background: `linear-gradient(to right, ${s.color}, transparent)` }} />
            <div className="ghost-numeral" style={{ fontSize: 160, top: 60, right: 10, color: `${s.color}10` }}>{s.n}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.2em", color: s.color, fontWeight: 700, marginBottom: 18, textTransform: "uppercase" }}>
              Step {s.n}
            </div>
            <h3 className="display" style={{ fontSize: 44, margin: "0 0 16px", color: s.color }}>{s.title}</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 4 — Sample result (browser chrome with mini dashboard inside)
function SampleSection() {
  return (
    <section style={{ padding: "120px 80px 120px 140px", position: "relative" }} className="grid-bg">
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, rgba(236, 53, 134, 0.08), transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 720, marginBottom: 60, position: "relative" }}>
        <div className="eyebrow">Sample result</div>
        <h2 className="display" style={{ fontSize: 64, margin: "20px 0 16px" }}>
          The money shot.
        </h2>
        <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          This is exactly what you'll see after your first scan. Score ring, pillar breakdown, and an issue list where every fix is a click away.
        </p>
      </div>

      <SampleBrowserMock />
    </section>
  );
}

function SampleBrowserMock() {
  return (
    <div style={{
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid var(--border-strong)",
      background: "var(--elevated)",
      boxShadow: "0 60px 120px rgba(0,0,0,0.5), 0 0 100px rgba(236,53,134,0.12)",
      position: "relative",
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 40,
        background: "#0a0a10",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 10,
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1, margin: "0 80px",
          height: 24, borderRadius: 6,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          padding: "0 12px",
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: "var(--text-muted)",
          gap: 8,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2.5"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/></svg>
          app.scanpulse.io/scan/acme.design
        </div>
      </div>

      {/* Mock dashboard interior */}
      <div style={{ padding: 36, background: "var(--canvas)", display: "grid", gridTemplateColumns: "360px 1fr", gap: 36 }}>
        {/* Left — score ring + pillar bars */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Favicon host="acme.design" size={24} bg="#ec3586" />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#fff" }}>acme.design</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ScoreRing score={74} delta="+6" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PILLARS.map(p => (
              <div key={p.key} style={{ display: "grid", gridTemplateColumns: "110px 1fr 34px", gap: 10, alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: p.color, fontWeight: 600 }}>
                  {p.label}
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${p.score}%`,
                    background: p.color,
                    boxShadow: `0 0 10px ${p.color}55`,
                    borderRadius: 999,
                  }} />
                </div>
                <div className="num" style={{ fontSize: 14, color: "#fff", textAlign: "right" }}>{p.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — issue list */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Top issues · ranked by impact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {QUICK_WINS.map((q, i) => {
              const p = PILLARS.find(x => x.key === q.pillar);
              return (
                <div key={i} style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: "var(--elevated)",
                  border: "1px solid var(--border)",
                  borderLeft: `2px solid ${p.color}`,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 20,
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span className="eyebrow-pillar" style={{ color: p.color }}>
                        <span style={{ width: 22, height: 2, background: p.color, display: "inline-block", marginRight: 6 }} />
                        {p.label}
                      </span>
                      <span className="num" style={{ fontSize: 13, color: "#00d4aa", marginLeft: "auto" }}>+{q.impact} pts</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{q.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{q.blurb}</div>
                  </div>
                  <button className="btn btn-pink-ghost" style={{ whiteSpace: "nowrap" }}>
                    {q.toolLabel} <Arrow size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 5 — Pricing
function PricingSection() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      tag: "Always free",
      blurb: "Kick the tires. One full scan per URL. No credit card.",
      features: ["1 scan per URL", "All 94 checks", "Full pillar breakdown", "Export as PDF"],
      cta: "Start scanning",
      primary: false,
    },
    {
      name: "Pro",
      price: "$15",
      per: "/ month",
      tag: "Most teams",
      blurb: "Unlimited scans, all 10 fix tools, monitoring, bulk, API.",
      features: ["Unlimited scans", "All 10 fix tools", "24h monitoring + alerts", "Bulk scan up to 500 URLs", "Full API access", "Score history, 12mo"],
      cta: "Start 14-day trial",
      primary: true,
    },
    {
      name: "Agency",
      price: "$59",
      per: "/ month",
      tag: "Consultants & studios",
      blurb: "Everything in Pro, plus white-label reports and 25 seats.",
      features: ["Everything in Pro", "White-label PDF reports", "25 team seats", "Priority support", "SSO + SAML", "Audit log"],
      cta: "Talk to us",
      primary: false,
    },
  ];
  return (
    <section style={{ padding: "120px 80px 120px 140px", position: "relative" }} className="grid-bg">
      <div style={{ maxWidth: 720, marginBottom: 60 }}>
        <div className="eyebrow">Pricing</div>
        <h2 className="display" style={{ fontSize: 64, margin: "20px 0 16px" }}>
          One plan does it.
        </h2>
        <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          Free for a single scan. Fifteen dollars unlocks everything — tools, monitoring, bulk, API.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
        {tiers.map(t => (
          <div key={t.name} className="card lift" style={{
            padding: "30px 28px",
            position: "relative",
            border: t.primary ? "1px solid rgba(236, 53, 134, 0.35)" : "1px solid var(--border)",
            background: t.primary ? "linear-gradient(180deg, rgba(236, 53, 134, 0.06), transparent 60%), var(--elevated)" : "var(--elevated)",
            boxShadow: t.primary ? "0 0 60px rgba(236, 53, 134, 0.12)" : "none",
          }}>
            {t.primary && <div className="card-accent-top" style={{ background: "var(--brand)", height: 2 }} />}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.name}</div>
              <span className="chip" style={{
                borderColor: t.primary ? "rgba(236, 53, 134, 0.3)" : "var(--border)",
                background: t.primary ? "var(--brand-soft)" : "rgba(255,255,255,0.03)",
                color: t.primary ? "var(--brand)" : "var(--text-muted)",
              }}>{t.tag}</span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span className="num" style={{ fontSize: 56 }}>{t.price}</span>
              {t.per && <span style={{ color: "var(--text-muted)", fontSize: 15 }}>{t.per}</span>}
            </div>

            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 24px" }}>{t.blurb}</p>

            <button className={t.primary ? "btn btn-primary" : "btn btn-ghost"} style={{ width: "100%", justifyContent: "center", height: 42, marginBottom: 24 }}>
              {t.cta} {t.primary && <Arrow size={14} />}
            </button>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {t.features.map((f, i) => (
                <li key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12l5 5L20 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 6 — Testimonials
function LoveSection() {
  const quotes = [
    { by: "Kira M.", role: "Head of Platform, orbital.studio", color: "#ec3586", q: "We fixed 38 points of security score in a Wednesday afternoon. The CSP Builder alone paid for the year." },
    { by: "Ana O.",  role: "Staff Engineer, harbor.build",      color: "#74b9ff", q: "Every other audit tool hands me a PDF to cry over. ScanPulse hands me the file I paste into nginx." },
    { by: "Sam R.",  role: "SEO Lead, meridian.work",            color: "#6c5ce7", q: "The per-pillar color coding is the actual product. I can scan a client in 10 seconds and know exactly who to loop in." },
    { by: "Jess T.", role: "Founder, kindred.studio",            color: "#00d4aa", q: "Monitoring emailed me about a regressed HSTS header before the deploy finished rolling out. Saved us a week." },
  ];
  return (
    <section style={{ padding: "120px 80px 120px 140px", position: "relative" }} className="grid-bg">
      <div style={{ maxWidth: 720, marginBottom: 60 }}>
        <div className="eyebrow">Teams on ScanPulse</div>
        <h2 className="display" style={{ fontSize: 64, margin: "20px 0 16px" }}>
          Scores, up and to the right.
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {quotes.map((q, i) => (
          <div key={i} className="card lift" style={{ padding: "30px 30px 28px", borderLeft: `2px solid ${q.color}`, position: "relative" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={q.color} opacity="0.15" style={{ position: "absolute", top: 22, right: 24 }}>
              <path d="M8 6C5 6 3 8 3 11v7h7v-7H7c0-1.5 1-2.5 2.5-3L8 6zm9 0c-3 0-5 2-5 5v7h7v-7h-3c0-1.5 1-2.5 2.5-3L17 6z"/>
            </svg>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, lineHeight: 1.45, margin: "0 0 22px", letterSpacing: "-0.02em" }}>
              "{q.q}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: q.color, color: "#fff",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{q.by.split(" ").map(s => s[0]).join("")}</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "#fff" }}>{q.by}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{q.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 7 — FAQ
function FAQSection() {
  const faqs = [
    { q: "How fast is a scan?", a: "Under 12 seconds for most sites. The page loads, 94 checks run in parallel, and the report renders with an animated score ring." },
    { q: "Do you store my site's content?", a: "No HTML or screenshots are retained. We store the check results (pass/warn/crit) and the derived scores. Pro users can opt in to 12 months of score history." },
    { q: "Can I scan a staging URL behind basic auth?", a: "Yes — Pro supports basic auth and custom headers per scan. Use the API or the Advanced toggle in the scan input." },
    { q: "What's included in the Free plan?", a: "One full scan per URL, all 94 checks, the full pillar breakdown, and a PDF export. Upgrading unlocks unlimited scans, monitoring, bulk, and the 10 fix tools." },
    { q: "Is there an API?", a: "Yes — REST and webhook. Pro gets 1,000 scans/mo via API; Agency is unmetered." },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: "120px 80px 160px 140px", position: "relative" }} className="grid-bg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 80 }}>
        <div>
          <div className="eyebrow">FAQ</div>
          <h2 className="display" style={{ fontSize: 56, margin: "20px 0 16px" }}>
            Questions.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
            Can't find yours? Email <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}>hi@scanpulse.io</a> — a human replies within a day.
          </p>
          <button className="btn btn-primary">Scan your site <Arrow size={14}/></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  padding: "24px 0",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  fontSize: 20, fontWeight: 600,
                  textAlign: "left",
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                {f.q}
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1px solid var(--border-strong)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: open === i ? "var(--brand)" : "var(--text-muted)",
                  transition: "transform 0.25s",
                  transform: open === i ? "rotate(45deg)" : "rotate(0)",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </span>
              </button>
              <div style={{
                maxHeight: open === i ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 560 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Landing — compose all 7
function LandingScreen() {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const i = sectionRefs.current.indexOf(e.target);
          if (i >= 0) setActive(i);
        }
      });
    }, { root: scroller, threshold: 0.4 });
    sectionRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const goTo = (i) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // landing has its own topbar (different from app)
  return (
    <div ref={scrollerRef} style={{ height: "100%", overflowY: "auto", background: "var(--canvas)", position: "relative" }}>
      <LandingTopbar onCta={goTo} />
      <SectionNav active={active} onGo={goTo} />

      <div ref={el => sectionRefs.current[0] = el}><HeroSection /></div>
      <div ref={el => sectionRefs.current[1] = el}><CoverageSection /></div>
      <div ref={el => sectionRefs.current[2] = el}><HowSection /></div>
      <div ref={el => sectionRefs.current[3] = el}><SampleSection /></div>
      <div ref={el => sectionRefs.current[4] = el}><PricingSection /></div>
      <div ref={el => sectionRefs.current[5] = el}><LoveSection /></div>
      <div ref={el => sectionRefs.current[6] = el}><FAQSection /></div>

      <footer style={{ padding: "40px 80px 50px 140px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo size={20} />
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>© 2026 ScanPulse · <a href="#" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</a> · <a href="#" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms</a></div>
        </div>
      </footer>
    </div>
  );
}

function LandingTopbar({ onCta }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      padding: "18px 80px 18px 140px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(7, 7, 10, 0.75)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <Logo size={20} />
      <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <a onClick={() => onCta(1)} style={NavLink}>Coverage</a>
        <a onClick={() => onCta(2)} style={NavLink}>How it works</a>
        <a onClick={() => onCta(4)} style={NavLink}>Pricing</a>
        <a onClick={() => onCta(6)} style={NavLink}>FAQ</a>
        <a style={NavLink}>Sign in</a>
        <button className="btn btn-primary" style={{ height: 38 }}>Start free <Arrow size={13}/></button>
      </nav>
    </header>
  );
}
const NavLink = { color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 500, textDecoration: "none" };

Object.assign(window, { LandingScreen });
