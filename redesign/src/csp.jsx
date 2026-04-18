// ScanPulse — Screen 5: CSP Builder tool
// Left 40% inputs · Right 60% output code + impact preview + install instructions

const DEFAULT_DIRECTIVES = [
  { name: "default-src", values: ["'self'"] },
  { name: "script-src",  values: ["'self'", "https://cdn.acme.design", "https://plausible.io"] },
  { name: "style-src",   values: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"] },
  { name: "img-src",     values: ["'self'", "data:", "https://*.acme.design"] },
  { name: "connect-src", values: ["'self'", "https://api.acme.design"] },
  { name: "font-src",    values: ["'self'", "https://fonts.gstatic.com"] },
  { name: "frame-src",   values: ["'none'"] },
];

const UNSAFE_VALUES = ["'unsafe-inline'", "'unsafe-eval'", "*", "data:"];

function CSPScreen() {
  const [directives, setDirectives] = useState(DEFAULT_DIRECTIVES);
  const [copied, setCopied] = useState(false);
  const [installOpen, setInstallOpen] = useState("nginx");

  const header = useMemo(() => {
    return directives
      .filter(d => d.values.length > 0)
      .map(d => `${d.name} ${d.values.join(" ")}`)
      .join("; ");
  }, [directives]);

  const hasUnsafe = directives.some(d => d.values.some(v => UNSAFE_VALUES.includes(v)));
  const uplift = hasUnsafe ? 9 : 12;

  const removeValue = (dIdx, vIdx) => {
    setDirectives(ds => ds.map((d, i) => i === dIdx ? { ...d, values: d.values.filter((_, j) => j !== vIdx) } : d));
  };
  const addValue = (dIdx, val) => {
    setDirectives(ds => ds.map((d, i) => i === dIdx ? { ...d, values: [...d.values, val] } : d));
  };

  const copy = () => {
    navigator.clipboard?.writeText(`Content-Security-Policy: ${header}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main style={{ flex: 1, background: "var(--canvas)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.35 }} className="grid-bg" />
      <div style={{ position: "absolute", top: -100, right: -100, width: 600, height: 600, background: "radial-gradient(circle, rgba(0, 212, 170, 0.06), transparent 60%)", pointerEvents: "none" }} />

      <CSPHeader uplift={uplift} />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "40% 60%", position: "relative", borderTop: "1px solid var(--border)" }}>
        {/* LEFT — inputs */}
        <div style={{
          padding: "32px 32px 60px",
          borderRight: "1px solid var(--border)",
          overflowY: "auto",
          height: "calc(100vh - 60px - 140px)",
        }}>
          <div className="eyebrow">Directive editor</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "10px 0 24px", lineHeight: 1.55 }}>
            Add allowed sources per directive. Tags with a warning icon weaken protection — remove them where possible.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {directives.map((d, i) => (
              <DirectiveRow key={d.name} d={d} dIdx={i} onRemove={removeValue} onAdd={addValue} />
            ))}
          </div>
        </div>

        {/* RIGHT — output */}
        <div style={{
          padding: "32px 32px 60px",
          overflowY: "auto",
          height: "calc(100vh - 60px - 140px)",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}>
          {/* Live output */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="eyebrow">Generated header · live</div>
              <span className="chip" style={{ borderColor: "rgba(0, 212, 170, 0.3)", background: "rgba(0, 212, 170, 0.08)", color: "var(--p-security)" }}>
                <span className="pulse-dot" style={{ background: "var(--p-security)", color: "var(--p-security)" }} />
                Updating as you edit
              </span>
            </div>
            <div style={{
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderLeft: "2px solid var(--p-security)",
              borderRadius: 10,
              padding: "20px 22px",
              position: "relative",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.75,
              color: "rgba(255, 255, 255, 0.85)",
              wordBreak: "break-all",
            }}>
              <button onClick={copy} style={{
                position: "absolute", top: 12, right: 12,
                padding: "6px 12px",
                borderRadius: 7,
                background: copied ? "var(--p-security)" : "var(--brand)",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-display)",
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: copied ? "0 0 20px rgba(0, 212, 170, 0.5)" : "0 0 20px rgba(236, 53, 134, 0.3)",
              }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <div style={{ color: "var(--text-faint)", fontSize: 11, marginBottom: 8 }}>HTTP response header</div>
              <div>
                <span style={{ color: "var(--p-security)" }}>Content-Security-Policy:</span>{" "}
                <HeaderValue directives={directives} />
              </div>
            </div>
          </div>

          {/* Impact preview */}
          <ImpactPreview uplift={uplift} hasUnsafe={hasUnsafe} />

          {/* Install accordion */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>How to install</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
              {["nginx", "apache", "cloudflare", "nextjs", "vercel"].map(k => (
                <InstallRow key={k} k={k} header={header} open={installOpen === k} setOpen={() => setInstallOpen(installOpen === k ? null : k)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
function CSPHeader({ uplift }) {
  return (
    <div style={{ padding: "22px 32px", background: "var(--surface)", position: "relative" }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--p-security), transparent)", top: 0 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", marginBottom: 10, fontFamily: "var(--font-display)" }}>
            <span style={{ cursor: "pointer" }}>Dashboard</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }}>Tools</span>
            <span>/</span>
            <span style={{ color: "#fff" }}>CSP Builder</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: 10,
              background: "rgba(0, 212, 170, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--p-security)",
            }}>
              <PillarIcon name="shield" size={20} stroke={1.8} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <span className="eyebrow-pillar" style={{ color: "var(--p-security)", fontSize: 11 }}>
                  <span style={{ width: 22, height: 2, background: "var(--p-security)", display: "inline-block", marginRight: 4 }} />
                  Security · Builder
                </span>
              </div>
              <h1 className="display" style={{ fontSize: 30, margin: 0, letterSpacing: "-0.03em" }}>Content Security Policy</h1>
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                Construct the CSP header that tells browsers which sources are allowed to load your scripts, styles, images and frames.
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 4 }}>Score uplift</div>
            <div className="num" style={{ fontSize: 30, color: "var(--p-security)" }}>+{uplift}</div>
          </div>
          <button className="btn btn-ghost" style={{ height: 40 }}>Reset</button>
          <button className="btn btn-primary" style={{ height: 40 }}>Save & rescan <Arrow size={13}/></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function DirectiveRow({ d, dIdx, onRemove, onAdd }) {
  const [input, setInput] = useState("");
  const hasUnsafe = d.values.some(v => UNSAFE_VALUES.includes(v));

  const submit = () => {
    const v = input.trim();
    if (v) {
      onAdd(dIdx, v.startsWith("'") || v.includes(":") || v.startsWith("http") ? v : v);
      setInput("");
    }
  };

  return (
    <div style={{
      background: "var(--elevated)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--p-security)", fontWeight: 600 }}>{d.name}</div>
        {hasUnsafe && (
          <span className="chip" style={{ borderColor: "rgba(255, 170, 0, 0.3)", background: "rgba(255, 170, 0, 0.1)", color: "#ffaa00" }}>
            <span className="dot" style={{ background: "#ffaa00" }} />
            Weakens protection
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {d.values.map((v, i) => {
          const unsafe = UNSAFE_VALUES.includes(v);
          return (
            <div key={i} style={{
              padding: "5px 5px 5px 10px",
              borderRadius: 6,
              background: unsafe ? "rgba(255, 170, 0, 0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${unsafe ? "rgba(255,170,0,0.3)" : "var(--border)"}`,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: unsafe ? "#ffaa00" : "#fff",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {v}
              <button onClick={() => onRemove(dIdx, i)} style={{
                width: 18, height: 18,
                border: "none",
                background: "rgba(255,255,255,0.06)",
                color: "var(--text-muted)",
                borderRadius: 4, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="+ Add source (e.g. https://cdn.example.com)"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button onClick={submit} className="btn btn-ghost" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Add</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function HeaderValue({ directives }) {
  return (
    <span>
      {directives.filter(d => d.values.length > 0).map((d, i) => (
        <span key={d.name}>
          {i > 0 && <span style={{ color: "var(--text-muted)" }}>; </span>}
          <span style={{ color: "var(--p-security)" }}>{d.name}</span>{" "}
          {d.values.map((v, j) => {
            const unsafe = UNSAFE_VALUES.includes(v);
            return (
              <span key={j} style={{ color: unsafe ? "#ffaa00" : "rgba(255,255,255,0.85)" }}>
                {v}{j < d.values.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
function ImpactPreview({ uplift, hasUnsafe }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setAnimate(false); const t = setTimeout(() => setAnimate(true), 100); return () => clearTimeout(t); }, [uplift]);

  return (
    <div className="card" style={{
      padding: "22px 24px",
      position: "relative",
      border: "1px solid rgba(0, 212, 170, 0.25)",
      background: "linear-gradient(180deg, rgba(0, 212, 170, 0.05), transparent 80%), var(--elevated)",
      boxShadow: "0 0 40px rgba(0, 212, 170, 0.08)",
    }}>
      <div className="card-accent-top" style={{ background: "linear-gradient(to right, var(--p-security), transparent)" }} />
      <div className="eyebrow" style={{ marginBottom: 16 }}>Projected score impact</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
        <ScoreDelta label="Security"        from={78} to={78 + uplift} color="var(--p-security)" animate={animate} />
        <ScoreDelta label="Overall"         from={74} to={74 + Math.round(uplift * 0.4)} color="var(--brand)" animate={animate} />
      </div>

      {hasUnsafe && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255, 170, 0, 0.08)",
          border: "1px solid rgba(255, 170, 0, 0.2)",
          color: "#ffaa00",
          fontSize: 12,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-mono)",
        }}>
          <StatusIcon status="warn" size={14} />
          Remove 'unsafe-inline' from style-src to unlock the full +12 uplift.
        </div>
      )}

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 44 }}>
        Rescan your site to verify
        <span style={{ marginLeft: 4, display: "inline-flex", transition: "transform 0.25s" }} className="arrow-animate">
          <Arrow size={14} stroke={2.2} />
        </span>
      </button>
    </div>
  );
}

function ScoreDelta({ label, from, to, color, animate }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="num" style={{ fontSize: 28, color: "var(--text-muted)" }}>{from}</span>
        <svg width="18" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        <span className="num" style={{
          fontSize: 32, color: color,
          textShadow: animate ? `0 0 20px ${color}66` : "none",
          transition: "text-shadow 0.4s",
        }}>{to}</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: color, fontWeight: 700 }}>+{to - from}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
const INSTALL_SNIPPETS = {
  nginx:      { label: "Nginx",       build: (h) => `# /etc/nginx/conf.d/acme.conf\nadd_header Content-Security-Policy "${h}" always;` },
  apache:     { label: "Apache",      build: (h) => `# .htaccess\n<IfModule mod_headers.c>\n  Header set Content-Security-Policy "${h}"\n</IfModule>` },
  cloudflare: { label: "Cloudflare Workers", build: (h) => `// worker.js\nexport default {\n  async fetch(req) {\n    const res = await fetch(req);\n    const out = new Response(res.body, res);\n    out.headers.set("Content-Security-Policy", "${h}");\n    return out;\n  }\n}` },
  nextjs:     { label: "Next.js",     build: (h) => `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [{\n      source: "/:path*",\n      headers: [{ key: "Content-Security-Policy", value: "${h}" }]\n    }];\n  }\n};` },
  vercel:     { label: "Vercel",      build: (h) => `// vercel.json\n{\n  "headers": [{\n    "source": "/(.*)",\n    "headers": [{ "key": "Content-Security-Policy", "value": "${h}" }]\n  }]\n}` },
};

function InstallRow({ k, header, open, setOpen }) {
  const s = INSTALL_SNIPPETS[k];
  const snippet = s.build(header);
  return (
    <div style={{ background: "var(--elevated)" }}>
      <button onClick={setOpen} style={{
        width: "100%",
        padding: "14px 18px",
        background: "transparent",
        border: "none",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: open ? "1px solid var(--border)" : "none",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: open ? "var(--brand)" : "var(--text-faint)" }} />
          {s.label}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <pre style={{
          margin: 0,
          padding: "16px 18px",
          background: "var(--canvas)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.65,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}>{snippet}</pre>
      )}
    </div>
  );
}

Object.assign(window, { CSPScreen });
