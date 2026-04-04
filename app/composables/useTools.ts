export interface Tool {
  slug: string
  title: string
  subtitle: string
  desc: string
  short: string
  pillar: string
  color: string
  fixes: number
  icon: string
}

export const TOOLS: Tool[] = [
  { slug: 'security-headers', title: 'Security Headers Generator', subtitle: 'Generator', desc: 'Generate HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy with a single click. Copy individual headers or the full block.', short: 'HSTS · X-Frame · Referrer · Permissions', pillar: 'Security', color: '#00d4aa', fixes: 5, icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/>` },
  { slug: 'csp-builder', title: 'CSP Header Builder', subtitle: 'Builder', desc: 'Visual Content-Security-Policy editor. Add sources per directive, get real-time warnings for unsafe-inline, unsafe-eval, and wildcard values, then copy the final header.', short: 'Directives · unsafe warnings · live output', pillar: 'Security', color: '#00d4aa', fixes: 2, icon: `<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>` },
  { slug: 'image-optimizer', title: 'Image Optimizer & Converter', subtitle: 'Optimizer', desc: 'Drag and drop PNG or JPEG files and convert them to WebP entirely in your browser. Adjust quality with a live slider and see exact file size savings before downloading.', short: 'PNG/JPEG → WebP · quality slider · savings', pillar: 'Performance', color: '#ffaa00', fixes: 2, icon: `<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>` },
  { slug: 'meta-generator', title: 'Meta Tag Generator', subtitle: 'Generator', desc: 'Build a complete head block with title, description, canonical URL, viewport, Open Graph, and Twitter Card tags. Live Google SERP preview updates in real time.', short: 'title · OG · Twitter · canonical · preview', pillar: 'SEO', color: '#6c5ce7', fixes: 7, icon: `<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>` },
  { slug: 'robots-txt', title: 'Robots.txt Generator', subtitle: 'Generator', desc: 'Visual editor for robots.txt. Add user-agent blocks, set allow and disallow rules, add a sitemap URL, and apply presets — download or copy the file.', short: 'user-agents · rules · presets · download', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>` },
  { slug: 'favicon-generator', title: 'Favicon Generator', subtitle: 'Generator', desc: 'Upload any source image and generate a favicon.ico and apple-touch-icon.png entirely client-side. Preview on a mock browser tab before downloading.', short: 'upload → ico · apple-touch · browser preview', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>` },
  { slug: 'schema-generator', title: 'Schema Markup Generator', subtitle: 'JSON-LD', desc: 'Guided form for Article, BlogPosting, and Organization JSON-LD structured data. Live script block preview, copy to clipboard or download as .json.', short: 'Article · Organization · JSON-LD · copy/download', pillar: 'SEO', color: '#6c5ce7', fixes: 3, icon: `<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>` },
  { slug: 'contrast-checker', title: 'Color Contrast Checker', subtitle: 'Checker', desc: 'Pick foreground and background colors to get WCAG 2.1 contrast ratio with pass/fail badges for AA Normal, AA Large, AAA Normal, and AAA Large.', short: 'WCAG AA · AAA · ratio · live preview', pillar: 'Accessibility', color: '#a29bfe', fixes: 0, icon: `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>` },
  { slug: 'email-auth', title: 'SPF / DKIM / DMARC Generator', subtitle: 'Generator', desc: 'Build SPF and DMARC TXT records with provider dropdowns, policy selectors, and reporting email. Get per-provider DKIM setup instructions.', short: 'providers · policy · TXT records · DKIM guide', pillar: 'DNS & Email', color: '#fd79a8', fixes: 3, icon: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>` },
]

export const PILLARS = [
  { key: 'Security',     color: '#00d4aa' },
  { key: 'Performance',  color: '#ffaa00' },
  { key: 'SEO',          color: '#6c5ce7' },
  { key: 'Accessibility',color: '#a29bfe' },
  { key: 'DNS & Email',  color: '#fd79a8' },
]

export function useToolNav() {
  const route  = useRoute()
  const router = useRouter()

  const slug    = computed(() => route.path.split('/tools/')[1] ?? '')
  const idx     = computed(() => TOOLS.findIndex(t => t.slug === slug.value))
  const current = computed(() => TOOLS[idx.value] ?? null)
  const prev    = computed(() => idx.value > 0 ? TOOLS[idx.value - 1] : null)
  const next    = computed(() => idx.value < TOOLS.length - 1 ? TOOLS[idx.value + 1] : null)

  function goTo(tool: Tool) { router.push(`/tools/${tool.slug}`) }

  return { slug, idx, current, prev, next, goTo }
}
