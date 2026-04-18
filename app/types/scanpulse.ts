// app/types/scanpulse.ts
// TypeScript interfaces matching HTML DATA_CONTRACTS byte-for-byte
// Severity: 'crit'|'warn'|'pass' — NEVER Convex-side 'critical'/'warning'

export type Severity = 'crit' | 'warn' | 'pass'

export type PillarKey = 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'

export interface Pillar {
  key: PillarKey
  label: string
  color: string
  icon: string
  score: number
  count: number
  desc: string
}

export interface Tool {
  id: string
  name: string
  pillar: PillarKey
  fixes: number
  blurb: string
  kind: string
}

export interface Scan {
  host: string
  scheme: string
  favicon: string
  faviconBg: string
  when: string
  overall: number
  trend: string
  pillars: Pillar[]
}

export interface Issue {
  status: Severity
  title: string
  blurb: string
  tool: string | null
}

export interface QuickWin {
  pillar: PillarKey
  impact: number
  title: string
  blurb: string
  tool: string
  toolLabel: string
}

export interface FeedItem {
  host: string
  pillar: PillarKey
  status: Severity
  msg: string
}

export interface Recent {
  host: string
  overall: number
  delta: string
  pillars: number[]
  when: string
}

// ─── Static reference data (mirrors redesign/src/data.jsx) ───────────────────

export const STATIC_PILLARS: Pillar[] = [
  { key: 'security',     label: 'Security',       color: '#00d4aa', icon: 'shield', score: 78, count: 18, desc: 'HTTPS, headers, CSP, CORS' },
  { key: 'performance', label: 'Performance',    color: '#ffaa00', icon: 'zap',    score: 64, count: 12, desc: 'TTFB, LCP, CLS, INP' },
  { key: 'seo',         label: 'SEO',            color: '#6c5ce7', icon: 'search', score: 82, count: 19, desc: 'Meta, schema, canonical' },
  { key: 'accessibility', label: 'Accessibility', color: '#a29bfe', icon: 'a11y',   score: 71, count: 14, desc: 'WCAG AA contrast, aria' },
  { key: 'ai',          label: 'AI Readiness',   color: '#ff7675', icon: 'spark',  score: 45, count: 9,  desc: 'llms.txt, structured data' },
  { key: 'dns',         label: 'DNS & Email',    color: '#74b9ff', icon: 'globe',  score: 88, count: 13, desc: 'SPF, DKIM, DMARC, MX' },
  { key: 'trust',       label: 'Trust',          color: '#fd79a8', icon: 'heart',  score: 91, count: 9,  desc: 'Privacy, terms, contact' },
]

export const STATIC_TOOLS: Tool[] = [
  { id: 'csp',      name: 'CSP Builder',        pillar: 'security',     fixes: 5, blurb: 'Generate Content-Security-Policy headers directive by directive.',      kind: 'Builder' },
  { id: 'headers',  name: 'Security Headers',   pillar: 'security',     fixes: 7, blurb: 'HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.',          kind: 'Generator' },
  { id: 'cors',     name: 'CORS Inspector',     pillar: 'security',     fixes: 3, blurb: 'Audit cross-origin policies and Access-Control headers.',               kind: 'Inspector' },
  { id: 'imgopt',   name: 'Image Optimizer',    pillar: 'performance', fixes: 6, blurb: 'AVIF/WebP conversion, responsive srcsets, lazy hints.',                kind: 'Optimizer' },
  { id: 'meta',     name: 'Meta Generator',     pillar: 'seo',         fixes: 8, blurb: 'Title, description, Open Graph, Twitter cards.',                        kind: 'Generator' },
  { id: 'schema',   name: 'Schema Generator',   pillar: 'seo',         fixes: 4, blurb: 'JSON-LD for Organization, Article, Product, FAQ.',                    kind: 'Generator' },
  { id: 'robots',   name: 'Robots.txt',         pillar: 'seo',         fixes: 2, blurb: 'Crawler rules, sitemap declaration, AI bot blocking.',                 kind: 'Builder' },
  { id: 'favicon',  name: 'Favicon Generator',  pillar: 'seo',         fixes: 3, blurb: 'Apple touch, Android, theme-color, multi-resolution.',                  kind: 'Generator' },
  { id: 'contrast', name: 'Contrast Checker',    pillar: 'accessibility', fixes: 5, blurb: 'WCAG AA/AAA pairs, suggested remediation tokens.',                   kind: 'Checker' },
  { id: 'email',    name: 'Email Auth',          pillar: 'dns',         fixes: 4, blurb: 'SPF, DMARC, DKIM alignment and syntax.',                              kind: 'Checker' },
  { id: 'llms',     name: 'AI Optimizer',        pillar: 'ai',         fixes: 6, blurb: 'llms.txt, crawler allowlist, structured summaries.',                  kind: 'Builder' },
]

// ─── Pillar → default tool fallback map ───────────────────────────────────

export const PILLAR_TO_DEFAULT_TOOL: Record<PillarKey, string | null> = {
  security:     'headers',
  performance:  'imgopt',
  seo:          'meta',
  accessibility: 'contrast',
  ai:           'llms',
  dns:          'email',
  trust:        null,
}

// ─── Severity adapter ─────────────────────────────────────────────────────

/**
 * Maps Convex severity ('critical' | 'warning' | 'pass')
 * to UI severity ('crit' | 'warn' | 'pass').
 */
export function adaptSeverity(s: 'critical' | 'warning' | 'pass'): Severity {
  if (s === 'critical') return 'crit'
  if (s === 'warning')  return 'warn'
  return 'pass'
}
