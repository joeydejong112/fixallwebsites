// ScanPulse — Shared mock data composable
// Contracts frozen from ScanPulse.html L705–834 (DATA_CONTRACTS)
// Replace with real Convex queries when wiring lands.

export interface Pillar {
  key: string
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
  pillar: string
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

export interface QuickWin {
  pillar: string
  impact: number
  title: string
  blurb: string
  tool: string
  toolLabel: string
}

export type IssueStatus = 'pass' | 'warn' | 'crit'

export interface Issue {
  status: IssueStatus
  title: string
  blurb: string
  tool: string | null
}

export type IssuesByPillar = Record<string, Issue[]>

export interface FeedItem {
  host: string
  pillar: string
  status: IssueStatus
  msg: string
}

export interface RecentScan {
  host: string
  overall: number
  delta: string
  pillars: number[]
  when: string
}

export interface Avatar {
  i: string
  c: string
}

export const PILLARS: Pillar[] = [
  { key: 'security',      label: 'Security',       color: '#00d4aa', icon: 'shield', score: 78, count: 18, desc: 'HTTPS, headers, CSP, CORS' },
  { key: 'performance',   label: 'Performance',    color: '#ffaa00', icon: 'zap',    score: 64, count: 12, desc: 'TTFB, LCP, CLS, INP' },
  { key: 'seo',           label: 'SEO',            color: '#6c5ce7', icon: 'search', score: 82, count: 19, desc: 'Meta, schema, canonical' },
  { key: 'accessibility', label: 'Accessibility',  color: '#a29bfe', icon: 'a11y',   score: 71, count: 14, desc: 'WCAG AA contrast, aria' },
  { key: 'ai',            label: 'AI Readiness',   color: '#ff7675', icon: 'spark',  score: 45, count: 9,  desc: 'llms.txt, structured data' },
  { key: 'dns',           label: 'DNS & Email',   color: '#74b9ff', icon: 'globe',  score: 88, count: 13, desc: 'SPF, DKIM, DMARC, MX' },
  { key: 'trust',         label: 'Trust',         color: '#fd79a8', icon: 'heart',  score: 91, count: 9,  desc: 'Privacy, terms, contact' },
]

export const TOOLS: Tool[] = [
  { id: 'csp',       name: 'CSP Builder',           pillar: 'security',    fixes: 5, blurb: 'Generate Content-Security-Policy headers directive by directive.', kind: 'Builder' },
  { id: 'headers',   name: 'Security Headers',      pillar: 'security',    fixes: 7, blurb: 'HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.', kind: 'Generator' },
  { id: 'cors',     name: 'CORS Inspector',         pillar: 'security',    fixes: 3, blurb: 'Audit cross-origin policies and Access-Control headers.', kind: 'Inspector' },
  { id: 'imgopt',   name: 'Image Optimizer',        pillar: 'performance', fixes: 6, blurb: 'AVIF/WebP conversion, responsive srcsets, lazy hints.', kind: 'Optimizer' },
  { id: 'meta',     name: 'Meta Generator',          pillar: 'seo',         fixes: 8, blurb: 'Title, description, Open Graph, Twitter cards.', kind: 'Generator' },
  { id: 'schema',   name: 'Schema Generator',        pillar: 'seo',         fixes: 4, blurb: 'JSON-LD for Organization, Article, Product, FAQ.', kind: 'Generator' },
  { id: 'robots',   name: 'Robots.txt',             pillar: 'seo',         fixes: 2, blurb: 'Crawler rules, sitemap declaration, AI bot blocking.', kind: 'Builder' },
  { id: 'favicon',  name: 'Favicon Generator',        pillar: 'seo',         fixes: 3, blurb: 'Apple touch, Android, theme-color, multi-resolution.', kind: 'Generator' },
  { id: 'contrast', name: 'Contrast Checker',        pillar: 'accessibility', fixes: 5, blurb: 'WCAG AA/AAA pairs, suggested remediation tokens.', kind: 'Checker' },
  { id: 'email',    name: 'Email Auth',              pillar: 'dns',         fixes: 4, blurb: 'SPF, DMARC, DKIM alignment and syntax.', kind: 'Checker' },
  { id: 'llms',     name: 'AI Optimizer',            pillar: 'ai',          fixes: 6, blurb: 'llms.txt, crawler allowlist, structured summaries.', kind: 'Builder' },
]

export const SCAN: Scan = {
  host: 'acme.design',
  scheme: 'https',
  favicon: 'A',
  faviconBg: '#ec3586',
  when: '12m ago',
  overall: 74,
  trend: '+6',
  pillars: PILLARS,
}

export const QUICK_WINS: QuickWin[] = [
  { pillar: 'security',    impact: 12, title: 'Missing Content-Security-Policy', blurb: 'No CSP header found. Attackers can inject scripts via XSS.', tool: 'csp',    toolLabel: 'Fix with CSP Builder' },
  { pillar: 'performance', impact: 9,  title: 'Unoptimized hero images',          blurb: '3.4 MB of JPEG where AVIF would ship under 400 KB.',        tool: 'imgopt', toolLabel: 'Fix with Image Optimizer' },
  { pillar: 'ai',          impact: 7,  title: 'No llms.txt file',                 blurb: 'AI crawlers have no curated summary of your site.',         tool: 'llms',   toolLabel: 'Fix with AI Optimizer' },
]

export const ISSUES: IssuesByPillar = {
  security: [
    { status: 'crit',  title: 'Missing Content-Security-Policy',       blurb: 'No CSP header found on any route.',                    tool: 'csp' },
    { status: 'warn',  title: 'Weak HSTS configuration',                blurb: 'max-age is 300s; recommended ≥ 1 year with preload.', tool: 'headers' },
    { status: 'warn',  title: 'Referrer-Policy not set',                blurb: 'Defaulting to no-referrer-when-downgrade.',            tool: 'headers' },
    { status: 'pass',  title: 'HTTPS enforced',                         blurb: 'Port 80 redirects to 443.',                            tool: null },
    { status: 'pass',  title: 'TLS 1.3 supported',                      blurb: 'Negotiating modern ciphers.',                          tool: null },
  ],
  performance: [
    { status: 'crit',  title: 'Largest Contentful Paint 4.1s',         blurb: 'Hero image is render-blocking and un-preloaded.',       tool: 'imgopt' },
    { status: 'warn',  title: 'No image lazy-loading',                  blurb: '12 below-the-fold images load eagerly.',                tool: 'imgopt' },
    { status: 'pass',  title: 'Gzip/Brotli enabled',                    blurb: 'Text assets compressed.',                               tool: null },
  ],
  seo: [
    { status: 'warn',  title: 'Missing Open Graph image',               blurb: 'Social shares will show a broken preview.',             tool: 'meta' },
    { status: 'warn',  title: 'No JSON-LD Organization schema',         blurb: 'Knowledge-panel eligibility reduced.',                   tool: 'schema' },
    { status: 'pass',  title: 'Canonical tag present',                   blurb: 'Preferred URL declared on every page.',                 tool: null },
    { status: 'pass',  title: 'sitemap.xml discoverable',                 blurb: 'Listed in robots.txt.',                                 tool: null },
  ],
  accessibility: [
    { status: 'crit',  title: 'Contrast ratio 2.7:1 on CTAs',          blurb: 'Pink on pink fails WCAG AA for normal text.',           tool: 'contrast' },
    { status: 'warn',  title: '3 images missing alt text',                 blurb: 'Screen readers will announce filenames.',               tool: null },
    { status: 'pass',  title: 'Landmarks present',                        blurb: 'main, nav, footer correctly used.',                    tool: null },
  ],
  ai: [
    { status: 'crit',  title: 'No /llms.txt',                           blurb: 'Provide a curated index for AI crawlers.',              tool: 'llms' },
    { status: 'warn',  title: 'Inconsistent product descriptions',         blurb: 'Detected 3 contradictory summaries across pages.',       tool: 'llms' },
  ],
  dns: [
    { status: 'warn',  title: 'DMARC policy is p=none',                  blurb: 'Monitoring only; spoofing not prevented.',               tool: 'email' },
    { status: 'pass',  title: 'SPF record valid',                         blurb: 'Includes _spf.google.com.',                            tool: null },
    { status: 'pass',  title: 'DKIM aligned on google._domainkey',        blurb: 'Signing active.',                                      tool: null },
  ],
  trust: [
    { status: 'pass',  title: 'Privacy policy linked in footer',          blurb: 'Reachable from every page.',                           tool: null },
    { status: 'pass',  title: 'Contact page present',                      blurb: 'Email and physical address provided.',                  tool: null },
  ],
}

export const FEED: FeedItem[] = [
  { host: 'stripe.com',        pillar: 'security',      status: 'pass', msg: 'CSP verified' },
  { host: 'nytimes.com',      pillar: 'performance',  status: 'warn', msg: 'LCP 3.2s' },
  { host: 'linear.app',       pillar: 'seo',          status: 'pass', msg: 'Schema complete' },
  { host: 'github.com',       pillar: 'accessibility', status: 'warn', msg: '2 contrast issues' },
  { host: 'notion.so',        pillar: 'ai',           status: 'crit', msg: 'No llms.txt' },
  { host: 'vercel.com',       pillar: 'dns',          status: 'pass', msg: 'DMARC p=reject' },
  { host: 'cloudflare.com',   pillar: 'trust',        status: 'pass', msg: 'All trust signals' },
  { host: 'raycast.com',      pillar: 'security',     status: 'pass', msg: 'HSTS preload' },
  { host: 'figma.com',        pillar: 'performance',  status: 'pass', msg: 'LCP 1.1s' },
  { host: 'supabase.com',     pillar: 'seo',          status: 'pass', msg: 'Open Graph set' },
  { host: 'railway.app',      pillar: 'ai',           status: 'warn', msg: 'Partial llms.txt' },
  { host: 'posthog.com',      pillar: 'accessibility', status: 'pass', msg: 'WCAG AA clear' },
  { host: 'planetscale.com',   pillar: 'dns',          status: 'warn', msg: 'SPF too permissive' },
  { host: 'sentry.io',        pillar: 'security',     status: 'warn', msg: 'HSTS max-age low' },
  { host: 'pitch.com',        pillar: 'trust',        status: 'pass', msg: 'Privacy clear' },
]

export const RECENT: RecentScan[] = [
  { host: 'acme.design',    overall: 74, delta: '+6',  pillars: [78, 64, 82, 71, 45, 88, 91], when: '12m ago' },
  { host: 'proto.studio',   overall: 88, delta: '+2',  pillars: [92, 85, 90, 88, 72, 95, 94], when: '2h ago' },
  { host: 'lumen.co',       overall: 61, delta: '-3',  pillars: [55, 48, 72, 68, 40, 80, 72], when: '1d ago' },
  { host: 'meridian.work',  overall: 93, delta: '+1',  pillars: [96, 90, 94, 92, 88, 97, 95], when: '2d ago' },
  { host: 'harbor.build',   overall: 52, delta: '+12', pillars: [60, 38, 58, 55, 32, 70, 65], when: '3d ago' },
  { host: 'kindred.studio', overall: 79, delta: '+4',  pillars: [82, 72, 85, 78, 58, 90, 88], when: '4d ago' },
]

export const AVATARS: Avatar[] = [
  { i: 'KM', c: '#ec3586' },
  { i: 'AO', c: '#74b9ff' },
  { i: 'SR', c: '#ffaa00' },
  { i: 'JT', c: '#00d4aa' },
  { i: 'LN', c: '#a29bfe' },
]

// Composable wrapper (enables future reactive data swaps)
export function useScanpulseData() {
  return {
    PILLARS,
    TOOLS,
    SCAN,
    QUICK_WINS,
    ISSUES,
    FEED,
    RECENT,
    AVATARS,
  }
}
