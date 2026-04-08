<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel'
import { useAppToast } from '~/composables/useAppToast'
import { FIX_SNIPPETS } from '~/utils/fixSnippets'

const TOOL_LINKS: Record<string, string> = {
  'Missing HSTS header': '/tools/security-headers', 'Weak HSTS configuration': '/tools/security-headers',
  'Missing clickjacking protection': '/tools/security-headers', 'Missing X-Content-Type-Options': '/tools/security-headers',
  'Missing Referrer-Policy': '/tools/security-headers', 'Weak Referrer-Policy': '/tools/security-headers',
  'Missing Permissions-Policy': '/tools/security-headers', 'No COEP header': '/tools/security-headers',
  'No COOP header': '/tools/security-headers',
  'Missing Content-Security-Policy': '/tools/csp-builder', 'Weak CSP configuration': '/tools/csp-builder',
  'Unoptimized image formats': '/tools/image-optimizer', 'Images missing lazy loading': '/tools/image-optimizer',
  'Images without dimensions': '/tools/image-optimizer',
  'Missing <title> tag': '/tools/meta-generator', 'Title length suboptimal': '/tools/meta-generator',
  'Missing meta description': '/tools/meta-generator', 'Meta description length suboptimal': '/tools/meta-generator',
  'Missing canonical URL': '/tools/meta-generator', 'Missing viewport meta tag': '/tools/meta-generator',
  'Incomplete Open Graph tags': '/tools/meta-generator', 'Incomplete Twitter Card tags': '/tools/meta-generator',
  'robots.txt not reachable': '/tools/robots-txt',
  'No favicon detected': '/tools/favicon-generator',
  'No structured data': '/tools/schema-generator', 'No author attribution': '/tools/schema-generator',
  'No publication dates': '/tools/schema-generator',
  'No SPF record found': '/tools/email-auth', 'SPF record too permissive': '/tools/email-auth',
  'No DMARC record found': '/tools/email-auth', 'DMARC policy not enforcing': '/tools/email-auth',
  'No DKIM record detected': '/tools/email-auth',
  'No llms.txt found': '/tools/ai-optimizer', 'No llms-full.txt found': '/tools/ai-optimizer',
  'AI crawlers blocked in robots.txt': '/tools/ai-optimizer',
}
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const { client, api } = useConvex()
const { client: wsClient } = useConvexWs()
const { toast, confirm } = useAppToast()

const scans       = ref<any[]>([])
const monitors    = ref<any[]>([])
const bulkScans   = ref<any[]>([])
const convexUser  = ref<{ plan: 'free' | 'pro'; scanCount: number } | null>(null)
const urlSparklines = ref<Map<string, number[]>>(new Map())
const recentComparisons = ref<{ urlA: string; urlB: string; scanIdA: string; scanIdB: string }[]>([])
const loading     = ref(true)

onMounted(() => {
  try {
    const raw = localStorage.getItem('sp_recent_comparisons')
    if (raw) recentComparisons.value = JSON.parse(raw)
  } catch {}
})
const scanning    = ref(false)
const filterStatus = ref<'all' | 'pass' | 'warning' | 'critical'>('all')
const router      = useRouter()
let unsubscribeScans: (() => void) | null = null
let unsubscribeMonitors: (() => void) | null = null

async function loadUserData(id: string) {
  loading.value = true
  try {
    const [userScans, user, userMonitors, userBulkScans] = await Promise.allSettled([
      client.query(api.scans.getScansByUser, { userId: id }),
      client.query(api.users.getUserByClerkId, { clerkId: id }),
      client.query(api.monitors.getMonitors, { userId: id }),
      client.query(api.bulkScans.getBulkScansByUser, { userId: id }),
    ])
    scans.value      = userScans.status === 'fulfilled' ? userScans.value : []
    convexUser.value = user.status === 'fulfilled' ? user.value : null
    monitors.value   = userMonitors.status === 'fulfilled' ? userMonitors.value : []
    bulkScans.value  = userBulkScans.status === 'fulfilled' ? userBulkScans.value : []

    const uniqueUrls = [...new Set(scans.value.filter(s => s.status === 'done').map(s => s.url))]
    const sparkResults = await Promise.allSettled(
      uniqueUrls.map(url => client.query(api.scoreHistory.getRecentHistory, { userId: id, url, limit: 15 }))
    )
    const map = new Map<string, number[]>()
    uniqueUrls.forEach((url, i) => {
      const r = sparkResults[i]
      if (r.status === 'fulfilled' && r.value?.length) {
        map.set(url, [...r.value].reverse().map((h: any) => h.overallScore).filter((v: any) => v != null))
      }
    })
    urlSparklines.value = map

    if (wsClient) {
      if (unsubscribeScans) unsubscribeScans()
      if (unsubscribeMonitors) unsubscribeMonitors()
      unsubscribeScans = wsClient.onUpdate(api.scans.getScansByUser, { userId: id }, (u) => { scans.value = u })
      unsubscribeMonitors = wsClient.onUpdate(api.monitors.getMonitors, { userId: id }, (u) => { monitors.value = u })
    }
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (unsubscribeScans) unsubscribeScans()
  if (unsubscribeMonitors) unsubscribeMonitors()
  if (resultPollInterval) clearInterval(resultPollInterval)
})

watch(userId, id => { if (id) loadUserData(id) }, { immediate: true })

let resultPollInterval: ReturnType<typeof setInterval> | null = null

async function handleScan(url: string) {
  if (!userId.value) return
  scanning.value = true
  try {
    const newScanId = await client.mutation(api.scans.createScan, { userId: userId.value, url })
    client.action(api.scanAction.runScan, { scanId: newScanId, url }).catch(() => {})
    selectedScan.value = { _id: newScanId, url, status: 'pending', _creationTime: Date.now() }
    currentView.value = 'result'
    scanning.value = false

    if (resultPollInterval) clearInterval(resultPollInterval)
    resultPollInterval = setInterval(async () => {
      const updated = await client.query(api.scans.getScan, { scanId: newScanId })
      if (updated) {
        selectedScan.value = updated
        const idx = scans.value.findIndex((s: any) => s._id === newScanId)
        if (idx >= 0) scans.value[idx] = updated
        else scans.value = [updated, ...scans.value]
      }
      if (updated?.status === 'done' || updated?.status === 'error') {
        clearInterval(resultPollInterval!); resultPollInterval = null
      }
    }, 2000)
  } catch (e) {
    scanning.value = false
    toast.error(e instanceof Error ? e.message : 'Scan failed')
  }
}

async function deleteScan(scanId: Id<'scans'>, e?: Event) {
  e?.preventDefault()
  const ok = await confirm({ message: 'This scan will be permanently removed from your history.', confirmLabel: 'Delete', cancelLabel: 'Keep' })
  if (!ok) return
  await client.mutation(api.scans.deleteScan, { scanId, userId: userId.value! })
  if (!wsClient) scans.value = scans.value.filter(s => s._id !== scanId)
  if (selectedScan.value?._id === scanId) setView('history')
}

async function reScan(url: string, e?: Event) {
  e?.preventDefault()
  await handleScan(url)
}

async function toggleMonitor(url: string, e?: Event) {
  e?.preventDefault()
  if (convexUser.value?.plan !== 'pro') {
    toast.warning('Monitoring is a Pro feature. Upgrade to watch your sites automatically.')
    return
  }
  const existing = monitors.value.find(m => m.url === url)
  if (existing) {
    const ok = await confirm({ message: `Stop monitoring ${url}?`, confirmLabel: 'Stop', cancelLabel: 'Keep' })
    if (ok) {
      await client.mutation(api.monitors.removeMonitor, { monitorId: existing._id, userId: userId.value! })
      toast.info(`Stopped monitoring ${url}`)
    }
  } else {
    await client.mutation(api.monitors.addMonitor, { userId: userId.value!, url, frequency: 'daily' })
    toast.success(`Started monitoring ${url} daily!`)
  }
}

function isMonitored(url: string) {
  return monitors.value.some(m => m.url === url && m.isActive)
}

function scoreTrend(url: string): '↑' | '↓' | '→' | null {
  const urlScans = scans.value
    .filter(s => s.url === url && s.status === 'done' && s.overallScore != null)
    .sort((a, b) => b._creationTime - a._creationTime)
  if (urlScans.length < 2) return null
  const diff = urlScans[0].overallScore - urlScans[1].overallScore
  if (diff > 2) return '↑'; if (diff < -2) return '↓'; return '→'
}
function trendColor(trend: string | null) {
  if (trend === '↑') return '#00d4aa'; if (trend === '↓') return '#ff4757'; return 'rgba(255,255,255,0.3)'
}
function faviconUrl(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32` } catch { return null }
}
function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

const doneScans = computed(() => scans.value.filter(s => s.status === 'done'))
const avgScore  = computed(() => {
  if (!doneScans.value.length) return null
  return Math.round(doneScans.value.reduce((s, x) => s + (x.overallScore ?? 0), 0) / doneScans.value.length)
})
const bestScore = computed(() => doneScans.value.length ? Math.max(...doneScans.value.map(s => s.overallScore ?? 0)) : null)
const filteredScans = computed(() => {
  if (filterStatus.value === 'all') return scans.value
  return scans.value.filter(s => {
    const score = s.overallScore ?? 0
    if (filterStatus.value === 'pass')     return s.status === 'done' && score >= 80
    if (filterStatus.value === 'warning')  return s.status === 'done' && score >= 60 && score < 80
    if (filterStatus.value === 'critical') return s.status === 'error' || (s.status === 'done' && score < 60)
    return true
  })
})

function scoreColor(score?: number) {
  if (score == null) return 'rgba(255,255,255,0.2)'
  if (score >= 80) return '#00d4aa'; if (score >= 60) return '#ffaa00'; return '#ff4757'
}
function scoreBg(score?: number) {
  if (score == null) return '#ffffff15'
  if (score >= 80) return '#00d4aa'; if (score >= 60) return '#ffaa00'; return '#ff4757'
}
function statusLabel(status: string) {
  return { pending: 'Queued', running: 'Scanning…', done: 'Complete', error: 'Failed' }[status] ?? status
}
function relativeTime(ts: number) {
  const diff = Date.now() - ts; const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`
}

// ── View management ────────────────────────────────────
type View = 'overview' | 'history' | 'compare' | 'bulk' | 'result' | 'scan' | 'charts' | 'tools' | 'tool-detail' | 'chart-detail'
const currentView  = ref<View>('overview')
const selectedScan = ref<any>(null)
const historySearch = ref('')
const toolsExpanded = ref(false)
const selectedTool  = ref<string | null>(null)
const selectedChartUrl = ref<string | null>(null)

function setView(v: View) {
  currentView.value = v
  if (v !== 'result') {
    selectedScan.value = null
    if (resultPollInterval) { clearInterval(resultPollInterval); resultPollInterval = null }
  }
}
function openScan(scan: any) { selectedScan.value = scan; currentView.value = 'result' }
function openScanByUrl(url: string) {
  const s = scans.value.filter(x => x.url === url && x.status === 'done').sort((a, b) => b._creationTime - a._creationTime)[0]
  if (s) openScan(s)
}
function openChartDetail(url: string) { selectedChartUrl.value = url; currentView.value = 'chart-detail' }
function openTool(slug: string) {
  selectedTool.value = slug
  toolsExpanded.value = true
  currentView.value = 'tool-detail'
}

provide('openTool', openTool)
function dashboardNavigate(href: string) {
  if (href === '/' || href === '/scan') { setView('scan'); return }
  const slug = href.split('/').pop()
  if (slug) openTool(slug)
}
provide('dashboardNavigate', dashboardNavigate)

// ── Async tool components ───────────────────────────────
const toolComponentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'security-headers': defineAsyncComponent(() => import('~/pages/tools/security-headers.vue')),
  'csp-builder':      defineAsyncComponent(() => import('~/pages/tools/csp-builder.vue')),
  'image-optimizer':  defineAsyncComponent(() => import('~/pages/tools/image-optimizer.vue')),
  'meta-generator':   defineAsyncComponent(() => import('~/pages/tools/meta-generator.vue')),
  'robots-txt':       defineAsyncComponent(() => import('~/pages/tools/robots-txt.vue')),
  'favicon-generator':defineAsyncComponent(() => import('~/pages/tools/favicon-generator.vue')),
  'schema-generator': defineAsyncComponent(() => import('~/pages/tools/schema-generator.vue')),
  'contrast-checker': defineAsyncComponent(() => import('~/pages/tools/contrast-checker.vue')),
  'email-auth':       defineAsyncComponent(() => import('~/pages/tools/email-auth.vue')),
  'ai-optimizer':     defineAsyncComponent(() => import('~/pages/tools/ai-optimizer.vue')),
}
const currentToolComponent = computed(() => selectedTool.value ? toolComponentMap[selectedTool.value] : null)
const currentToolMeta = computed(() => allTools.find(t => t.slug === selectedTool.value) ?? null)

const topbarInfo = computed(() => ({
  overview:     { title: 'Command Center',  sub: 'Overview of all your scans' },
  history:      { title: 'Scan History',    sub: `${scans.value.length} scans` },
  compare:      { title: 'Compare',         sub: 'Side-by-side competitor analysis' },
  bulk:         { title: 'Bulk Scan',       sub: 'Scan multiple URLs at once' },
  scan:         { title: 'New Scan',        sub: 'Analyze a website across 7 pillars' },
  charts:       { title: 'Charts',          sub: `Analytics for ${doneScans.value.length} completed scans` },
  tools:        { title: 'Tools',           sub: '10 free web audit tools' },
  'tool-detail':  { title: currentToolMeta.value?.title ?? 'Tool', sub: currentToolMeta.value?.pillar ?? '' },
  'chart-detail': { title: selectedChartUrl.value ? hostname(selectedChartUrl.value) : 'Site Charts', sub: 'Score history & pillar breakdown' },
  result:         { title: selectedScan.value ? hostname(selectedScan.value.url) : 'Result', sub: selectedScan.value?.status === 'pending' || selectedScan.value?.status === 'running' ? 'Scanning…' : selectedScan.value ? `Scanned ${relativeTime(selectedScan.value._creationTime)}` : '' },
})[currentView.value])

// ── Result view state ──────────────────────────────────
type IssueTab = 'all' | 'security' | 'performance' | 'seo' | 'accessibility' | 'ai' | 'dns' | 'trust'
const resultActiveTab = ref<IssueTab>('all')
const resultExpandedFix = ref<string | null>(null)
const resultCopied = ref(false)
const resultIssueTabs: IssueTab[] = ['all', 'security', 'performance', 'seo', 'accessibility', 'ai', 'dns', 'trust']
const resultIssues = computed(() => {
  if (!selectedScan.value?.issues) return []
  if (resultActiveTab.value === 'all') return selectedScan.value.issues
  return selectedScan.value.issues.filter((i: any) => i.pillar === resultActiveTab.value)
})
function issueTabCount(tab: string) {
  if (!selectedScan.value?.issues) return 0
  if (tab === 'all') return selectedScan.value.issues.length
  return selectedScan.value.issues.filter((i: any) => i.pillar === tab).length
}
const PILLAR_COLORS: Record<string, string> = {
  security: '#00d4aa', performance: '#ffaa00', seo: '#6c5ce7',
  accessibility: '#a29bfe', ai: '#ff7675', dns: '#74b9ff', trust: '#fd79a8',
}
function pillarColor(pillar: string) { return { color: PILLAR_COLORS[pillar] ?? 'rgba(255,255,255,0.4)' } }
function shareResult() {
  if (!selectedScan.value?._id) return
  navigator.clipboard.writeText(`${window.location.origin}/share/${selectedScan.value._id}`)
  resultCopied.value = true; setTimeout(() => resultCopied.value = false, 2000)
  toast.success('Share link copied!')
}

const filteredHistoryScans = computed(() => {
  let list = filteredScans.value
  if (historySearch.value.trim()) {
    const q = historySearch.value.toLowerCase()
    list = list.filter(s => s.url.toLowerCase().includes(q))
  }
  return list
})

// ── Topbar scan input ──────────────────────────────────
const newScanUrl = ref('')
function submitNewScan() {
  const url = newScanUrl.value.trim()
  if (url) { handleScan(url); newScanUrl.value = '' }
}

// ── Chart data ─────────────────────────────────────────
const scansPerDay = computed(() => {
  const days: { label: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const end = start + 86400000
    const count = scans.value.filter(s => s._creationTime >= start && s._creationTime < end).length
    days.push({ label, count })
  }
  return days
})
const avgPillarScores = computed(() => {
  const avg = (key: string) => {
    const vals = doneScans.value.map((s: any) => s[key]).filter((v: any) => v != null)
    return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0
  }
  return [
    { name: 'Security',      score: avg('securityScore'),      color: '#00d4aa' },
    { name: 'Performance',   score: avg('performanceScore'),   color: '#ffaa00' },
    { name: 'SEO',           score: avg('seoScore'),           color: '#6c5ce7' },
    { name: 'Accessibility', score: avg('accessibilityScore'), color: '#a29bfe' },
    { name: 'AI Readiness',  score: avg('aiScore'),            color: '#ff7675' },
    { name: 'DNS & Email',   score: avg('dnsScore'),           color: '#74b9ff' },
    { name: 'Trust',         score: avg('trustScore'),         color: '#fd79a8' },
  ]
})
const scoreDistribution = computed(() => {
  const critical = doneScans.value.filter(s => (s.overallScore ?? 0) < 60).length
  const warning  = doneScans.value.filter(s => { const sc = s.overallScore ?? 0; return sc >= 60 && sc < 80 }).length
  const good     = doneScans.value.filter(s => (s.overallScore ?? 0) >= 80).length
  const total    = doneScans.value.length || 1
  return [
    { label: 'Good (80+)',      count: good,     pct: Math.round(good     / total * 100), color: '#00d4aa' },
    { label: 'Warning (60–79)', count: warning,  pct: Math.round(warning  / total * 100), color: '#ffaa00' },
    { label: 'Critical (<60)', count: critical,  pct: Math.round(critical / total * 100), color: '#ff4757' },
  ]
})
const topSites = computed(() => {
  const map = new Map<string, { url: string; count: number; latestScore: number | null }>()
  for (const s of doneScans.value) {
    const e = map.get(s.url)
    if (e) e.count++
    else map.set(s.url, { url: s.url, count: 1, latestScore: s.overallScore ?? null })
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8)
})

interface ChartPoint {
  score: number; time: number
  securityScore?: number; performanceScore?: number; seoScore?: number; accessibilityScore?: number
}
const urlCharts = computed(() => {
  const map = new Map<string, ChartPoint[]>()
  for (const s of doneScans.value) {
    if (s.overallScore == null) continue
    if (!map.has(s.url)) map.set(s.url, [])
    map.get(s.url)!.push({
      score: s.overallScore, time: s._creationTime,
      securityScore: s.securityScore, performanceScore: s.performanceScore,
      seoScore: s.seoScore, accessibilityScore: s.accessibilityScore,
    })
  }
  return [...map.entries()]
    .map(([url, pts]) => {
      const sorted = [...pts].sort((a, b) => a.time - b.time)
      return { url, points: sorted, latest: sorted[sorted.length - 1] }
    })
    .sort((a, b) => b.points.length - a.points.length)
})

function chartSvgPoints(scores: number[]): string {
  if (scores.length === 1) return `150,${62 - scores[0] / 100 * 52}`
  return scores.map((s, i) => `${12 + i / (scores.length - 1) * 276},${62 - s / 100 * 52}`).join(' ')
}
function chartAreaPath(scores: number[]): string {
  if (scores.length < 2) return ''
  const pts = scores.map((s, i) => `${12 + i / (scores.length - 1) * 276},${62 - s / 100 * 52}`)
  const lastX = 12 + 276
  return `M ${pts.join(' L ')} L ${lastX},70 L 12,70 Z`
}
function chartDotX(i: number, total: number): number {
  return total === 1 ? 150 : 12 + i / (total - 1) * 276
}
function chartDotY(score: number): number {
  return 62 - score / 100 * 52
}
function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

// ── Chart detail ────────────────────────────────────────
const chartDetailScans = computed(() => {
  if (!selectedChartUrl.value) return []
  return scans.value
    .filter(s => s.url === selectedChartUrl.value && s.status === 'done' && s.overallScore != null)
    .sort((a, b) => a._creationTime - b._creationTime)
})
const chartDetailLatest = computed(() => chartDetailScans.value[chartDetailScans.value.length - 1] ?? null)
const chartDetailPillars = computed(() => [
  { key: 'securityScore',     label: 'Security',     color: '#00d4aa' },
  { key: 'performanceScore',  label: 'Performance',  color: '#ffaa00' },
  { key: 'seoScore',          label: 'SEO',          color: '#6c5ce7' },
  { key: 'accessibilityScore',label: 'Accessibility',color: '#a29bfe' },
  { key: 'aiScore',           label: 'AI Readiness', color: '#ff7675' },
  { key: 'dnsScore',          label: 'DNS & Email',  color: '#74b9ff' },
].map(p => ({
  ...p,
  scores: chartDetailScans.value.map((s: any) => s[p.key]).filter((v: any) => v != null) as number[],
  latest: chartDetailLatest.value ? (chartDetailLatest.value as any)[p.key] ?? null : null,
})).filter(p => p.scores.length > 0))

// SVG helpers for chart-detail (viewBox 560×150)
const CD_W = 560; const CD_H = 150
const CD_PL = 34; const CD_PR = 14; const CD_PT = 14; const CD_PB = 30
const CD_CW = CD_W - CD_PL - CD_PR   // 512
const CD_CH = CD_H - CD_PT - CD_PB   // 106
function cdX(i: number, n: number): number {
  return n <= 1 ? CD_PL + CD_CW / 2 : CD_PL + (i / (n - 1)) * CD_CW
}
function cdY(score: number): number { return CD_PT + (1 - score / 100) * CD_CH }
function cdPolyline(scores: number[]): string {
  return scores.map((s, i) => `${cdX(i, scores.length)},${cdY(s)}`).join(' ')
}
function cdAreaPath(scores: number[]): string {
  if (scores.length < 2) return ''
  const pts = scores.map((s, i) => `${cdX(i, scores.length)},${cdY(s)}`).join(' L ')
  return `M ${pts} L ${cdX(scores.length - 1, scores.length)},${CD_PT + CD_CH} L ${CD_PL},${CD_PT + CD_CH} Z`
}
const CD_GRID = [0, 25, 50, 75, 100]

// ── Tools ──────────────────────────────────────────────
const allTools = [
  { slug: 'security-headers', title: 'Security Headers Generator', subtitle: 'Generator', desc: 'Generate HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy with a single click. Copy individual headers or the full block.', short: 'HSTS · X-Frame · Referrer · Permissions', pillar: 'Security', color: '#00d4aa', fixes: 5, icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.88-2.67 7.52-6 8.93-3.33-1.41-6-5.05-6-8.93V7.67L12 5z"/>` },
  { slug: 'csp-builder', title: 'CSP Header Builder', subtitle: 'Builder', desc: 'Visual Content-Security-Policy editor. Add sources per directive, get real-time warnings for unsafe-inline, unsafe-eval, and wildcard values, then copy the final header.', short: 'Directives · unsafe warnings · live output', pillar: 'Security', color: '#00d4aa', fixes: 2, icon: `<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>` },
  { slug: 'image-optimizer', title: 'Image Optimizer & Converter', subtitle: 'Optimizer', desc: 'Drag and drop PNG or JPEG files and convert them to WebP entirely in your browser. Adjust quality with a live slider and see exact file size savings before downloading.', short: 'PNG/JPEG → WebP · quality slider · savings', pillar: 'Performance', color: '#ffaa00', fixes: 2, icon: `<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>` },
  { slug: 'meta-generator', title: 'Meta Tag Generator', subtitle: 'Generator', desc: 'Build a complete head block with title, description, canonical URL, viewport, Open Graph, and Twitter Card tags. Live Google SERP preview updates in real time.', short: 'title · OG · Twitter · canonical · preview', pillar: 'SEO', color: '#6c5ce7', fixes: 7, icon: `<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>` },
  { slug: 'robots-txt', title: 'Robots.txt Generator', subtitle: 'Generator', desc: 'Visual editor for robots.txt. Add user-agent blocks, set allow and disallow rules, add a sitemap URL, and apply presets — download or copy the file.', short: 'user-agents · rules · presets · download', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>` },
  { slug: 'favicon-generator', title: 'Favicon Generator', subtitle: 'Generator', desc: 'Upload any source image and generate a favicon.ico and apple-touch-icon.png entirely client-side. Preview on a mock browser tab before downloading.', short: 'upload → ico · apple-touch · browser preview', pillar: 'SEO', color: '#6c5ce7', fixes: 1, icon: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>` },
  { slug: 'schema-generator', title: 'Schema Markup Generator', subtitle: 'JSON-LD', desc: 'Guided form for Article, BlogPosting, and Organization JSON-LD structured data. Live script block preview, copy to clipboard or download as .json.', short: 'Article · Organization · JSON-LD · copy/download', pillar: 'SEO', color: '#6c5ce7', fixes: 3, icon: `<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>` },
  { slug: 'contrast-checker', title: 'Color Contrast Checker', subtitle: 'Checker', desc: 'Pick foreground and background colors to get WCAG 2.1 contrast ratio with pass/fail badges for AA Normal, AA Large, AAA Normal, and AAA Large.', short: 'WCAG AA · AAA · ratio · live preview', pillar: 'Accessibility', color: '#a29bfe', fixes: 0, icon: `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>` },
  { slug: 'email-auth', title: 'SPF / DKIM / DMARC Generator', subtitle: 'Generator', desc: 'Build SPF and DMARC TXT records with provider dropdowns, policy selectors, and reporting email. Get per-provider DKIM setup instructions.', short: 'providers · policy · TXT records · DKIM guide', pillar: 'DNS & Email', color: '#fd79a8', fixes: 3, icon: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>` },
  { slug: 'ai-optimizer', title: 'AI Optimizer & llms.txt Generator', subtitle: 'Generator', desc: 'Generate a valid llms.txt file for LLM ingestion, build AI-friendly robots.txt rules, and test how well your content is structured for answer engines like ChatGPT and Perplexity.', short: 'llms.txt · AI crawlers · robots.txt snippets', pillar: 'AI Readiness', color: '#ff7675', fixes: 3, icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>` },
]
const toolPillars = [
  { key: 'all', label: 'All tools', color: '#ec3586' },
  { key: 'Security', label: 'Security', color: '#00d4aa' },
  { key: 'Performance', label: 'Performance', color: '#ffaa00' },
  { key: 'SEO', label: 'SEO', color: '#6c5ce7' },
  { key: 'Accessibility', label: 'Accessibility', color: '#a29bfe' },
  { key: 'DNS & Email', label: 'DNS & Email', color: '#fd79a8' },
  { key: 'AI Readiness', label: 'AI Readiness', color: '#ff7675' },
]
const toolsFilter  = ref('all')
const toolsFiltered  = computed(() => toolsFilter.value === 'all' ? allTools : allTools.filter(t => t.pillar === toolsFilter.value))
const toolsFeatured  = computed(() => toolsFiltered.value[0] ?? null)
const toolsRest      = computed(() => toolsFiltered.value.slice(1))
const toolsPillarCount = (key: string) => key === 'all' ? allTools.length : allTools.filter(t => t.pillar === key).length

// ── Compare form ───────────────────────────────────────
const compareUrlA = ref(''); const compareUrlB = ref('')
function submitCompare() {
  const a = compareUrlA.value.trim(); const b = compareUrlB.value.trim()
  if (a && b) router.push(`/compare?urlA=${encodeURIComponent(a)}&urlB=${encodeURIComponent(b)}`)
}
</script>

<template>
  <div class="ds-shell">
    <NavBar />

    <!-- ── SIDEBAR ──────────────────────────────────────── -->
    <aside class="ds-sidebar">
      <div class="ds-logo">
        <NuxtLink to="/" class="ds-logo-inner">
          <div class="ds-logo-mark">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="white"/><circle cx="8" cy="8" r="6" stroke="white" stroke-width="1.5"/></svg>
          </div>
          <span class="ds-logo-text">ScanPulse</span>
        </NuxtLink>
        <span v-if="convexUser" class="ds-plan-badge" :class="convexUser.plan === 'pro' ? 'ds-plan-pro' : 'ds-plan-free'">
          {{ convexUser.plan === 'pro' ? 'PRO' : 'FREE' }}
        </span>
      </div>

      <nav class="ds-nav">
        <div class="ds-nav-section">Main</div>
        <button @click="setView('overview')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'overview' }">
          <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
          Overview
        </button>
        <button @click="setView('scan')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'scan' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" stroke-linecap="round"/></svg>
          Scan
        </button>
        <button @click="setView('history')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'history' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2.5 2.5" stroke-linecap="round"/></svg>
          Scan History
          <span v-if="scans.length" class="ds-nav-badge">{{ scans.length }}</span>
        </button>
        <button @click="setView('charts')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'charts' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="2" height="5" rx="1"/><rect x="7" y="5" width="2" height="9" rx="1"/><rect x="12" y="2" width="2" height="12" rx="1"/></svg>
          Charts
        </button>
        <button @click="setView('compare')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'compare' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4M7 4L3 8l4 4"/></svg>
          Compare
          <span v-if="recentComparisons.length" class="ds-nav-count">{{ recentComparisons.length }}</span>
        </button>
        <button @click="setView('bulk')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'bulk' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="3" rx="1"/><rect x="2" y="7" width="12" height="3" rx="1"/><rect x="2" y="12" width="8" height="2" rx="1"/></svg>
          Bulk Scan
          <span v-if="bulkScans.length" class="ds-nav-count">{{ bulkScans.length }}</span>
        </button>

        <div class="ds-nav-section" style="margin-top:10px;">Tools</div>
        <button @click="toolsExpanded = !toolsExpanded; setView('tools')" class="ds-nav-item" :class="{ 'ds-nav-active': currentView === 'tools' }">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 2l-1.5 1.5 4 4L14 6l-4-4zM6.5 5.5l-5 5 .7 3.3 3.3.7 5-5-4-4zM2 14l1.5-1.5"/></svg>
          Tools
          <svg class="ds-nav-chevron" :class="{ 'ds-nav-chevron--open': toolsExpanded }" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7l3 3 3-3"/></svg>
        </button>
        <div v-show="toolsExpanded" class="ds-tools-dropdown">
          <button v-for="t in allTools" :key="t.slug" class="ds-tools-sub-item" :class="{ 'ds-tools-sub-active': selectedTool === t.slug && currentView === 'tool-detail' }" :style="selectedTool === t.slug && currentView === 'tool-detail' ? `--ac:${t.color}` : ''" @click="openTool(t.slug)">
            <div class="ds-tools-sub-dot" :style="{ background: t.color }"></div>
            <span>{{ t.title }}</span>
          </button>
        </div>

        <div class="ds-nav-section" style="margin-top:10px;">Monitored Sites</div>
        <div v-if="!monitors.length" class="ds-nav-empty">No sites monitored yet</div>
        <template v-else>
          <button
            v-for="m in monitors.slice(0, 6)"
            :key="m._id"
            @click="openScanByUrl(m.url)"
            class="ds-nav-item"
            :class="{ 'ds-nav-active': currentView === 'result' && selectedScan?.url === m.url }"
          >
            <div class="ds-site-dot" :style="{ background: scoreBg(m.lastScore) }"></div>
            <span class="ds-site-name">{{ hostname(m.url) }}</span>
          </button>
        </template>

        <div class="ds-nav-section" style="margin-top:10px;">Account</div>
        <NuxtLink to="/settings" class="ds-nav-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
          Settings
        </NuxtLink>
        <NuxtLink to="/pricing" class="ds-nav-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5 6.5 5z"/></svg>
          Upgrade
        </NuxtLink>
      </nav>

      <div class="ds-user">
        <div class="ds-user-avatar">{{ userId?.slice(5, 7)?.toUpperCase() || 'ME' }}</div>
        <div class="ds-user-info">
          <div class="ds-user-plan">{{ convexUser?.plan === 'pro' ? 'Pro Plan' : 'Free Plan' }}</div>
          <div v-if="convexUser && convexUser.plan !== 'pro'" class="ds-user-sub">{{ convexUser.scanCount }} / 1 scans used</div>
          <div v-else-if="convexUser" class="ds-user-sub">Unlimited scans</div>
        </div>
      </div>
    </aside>

    <!-- ── MAIN ─────────────────────────────────────────── -->
    <div class="ds-main">
      <div class="ds-topbar">
        <div class="ds-topbar-left">
          <button v-if="currentView === 'result' || currentView === 'tool-detail' || currentView === 'chart-detail'" @click="currentView === 'tool-detail' ? setView('tools') : currentView === 'chart-detail' ? setView('charts') : setView('history')" class="ds-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
          </button>
          <div>
            <div class="ds-topbar-title">{{ topbarInfo?.title }}</div>
            <div class="ds-topbar-sub">{{ topbarInfo?.sub }}</div>
          </div>
        </div>
        <div class="ds-topbar-spacer" />
        <div class="ds-scan-row">
          <input v-model="newScanUrl" class="ds-scan-input" placeholder="https://example.com" @keydown.enter="submitNewScan" />
          <button class="ds-scan-btn" @click="submitNewScan" :disabled="scanning">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
            {{ scanning ? 'Scanning…' : 'New Scan' }}
          </button>
        </div>
      </div>

      <!-- ── CONTENT ───────────────────────────────────── -->
      <div class="ds-content">

        <!-- Loading -->
        <template v-if="loading">
          <div class="ds-stats-row">
            <div v-for="i in 4" :key="i" class="ds-stat-card ds-skeleton" style="height:82px;" />
          </div>
          <div class="ds-mid-grid">
            <div class="ds-card ds-skeleton" style="height:240px;" />
            <div class="ds-card ds-skeleton" style="height:240px;" />
          </div>
        </template>

        <template v-else>

          <!-- ══════════════════════════════════════════════
               VIEW: OVERVIEW
          ══════════════════════════════════════════════════ -->
          <template v-if="currentView === 'overview'">
            <div class="ds-stats-row">
              <div class="ds-stat-card">
                <div class="ds-stat-label">Total Scans</div>
                <div class="ds-stat-value" style="color:#ec3586">{{ scans.length }}</div>
                <div class="ds-stat-delta">Across all sites</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Avg Score</div>
                <div class="ds-stat-value" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
                <div class="ds-stat-delta">{{ doneScans.length }} completed</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Low Score Sites</div>
                <div class="ds-stat-value" style="color:#ff4757">{{ doneScans.filter(s => (s.overallScore ?? 100) < 60).length + scans.filter(s => s.status === 'error').length }}</div>
                <div class="ds-stat-delta" style="color:rgba(255,71,87,0.6)">Score below 60</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Monitored Sites</div>
                <div class="ds-stat-value" style="color:#ffaa00">{{ monitors.length }}</div>
                <div class="ds-stat-delta"><button class="ds-stat-link" @click="setView('bulk')">{{ bulkScans.length }} bulk scan{{ bulkScans.length !== 1 ? 's' : '' }}</button></div>
              </div>
            </div>

            <div class="ds-mid-grid">
              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Pillar Scores</div>
                  <button v-if="doneScans[0]" @click="openScan(doneScans[0])" class="ds-card-action">{{ hostname(doneScans[0].url) }} →</button>
                  <span v-else class="ds-card-sub">Most recent scan</span>
                </div>
                <div v-if="!doneScans.length" class="ds-empty-state">
                  <Logo :animate="false" class="ds-empty-logo" />
                  <p>Scan a site to see pillar scores</p>
                </div>
                <div v-else class="ds-pillars-grid">
                  <div v-for="[name, val, color] in [
                    ['Security',      doneScans[0].securityScore,      '#00d4aa'],
                    ['Performance',   doneScans[0].performanceScore,   '#ffaa00'],
                    ['SEO',           doneScans[0].seoScore,           '#6c5ce7'],
                    ['Accessibility', doneScans[0].accessibilityScore, '#a29bfe'],
                    ['AI Readiness',  doneScans[0].aiScore,            '#ff7675'],
                    ['DNS & Email',   doneScans[0].dnsScore,           '#74b9ff'],
                    ['Trust',         doneScans[0].trustScore,         '#fd79a8'],
                  ]" :key="String(name)" class="ds-pillar-row">
                    <div class="ds-pillar-dot" :style="{ background: String(color) }"></div>
                    <div class="ds-pillar-name">{{ name }}</div>
                    <div class="ds-pillar-bar-bg"><div class="ds-pillar-bar" :style="{ width: (Number(val) || 0) + '%', background: String(color) }"></div></div>
                    <div class="ds-pillar-score" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.2)' }">{{ val ?? '—' }}</div>
                  </div>
                </div>
              </div>

              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Recent Scans</div>
                  <button @click="setView('history')" class="ds-card-action">See all →</button>
                </div>
                <div v-if="!scans.length" class="ds-empty-state"><p>No scans yet</p></div>
                <template v-else>
                  <button v-for="scan in scans.slice(0, 6)" :key="scan._id" @click="openScan(scan)" class="ds-scan-item">
                    <div class="ds-scan-fav">
                      <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-4 h-4 rounded" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="ds-scan-info">
                      <div class="ds-scan-domain">{{ hostname(scan.url) }}</div>
                      <div class="ds-scan-time">{{ relativeTime(scan._creationTime) }}</div>
                    </div>
                    <div class="ds-scan-right">
                      <span v-if="scan.status === 'running'" class="ds-scan-running">●</span>
                      <span v-else-if="scan.status === 'error'" class="ds-scan-score" style="color:#ff4757;font-size:16px;">!</span>
                      <span v-else class="ds-scan-score" :style="{ color: scoreBg(scan.overallScore) }">{{ scan.overallScore ?? '—' }}</span>
                    </div>
                  </button>
                </template>
              </div>
            </div>

            <div class="ds-bottom-grid">
              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Monitored Sites</div>
                  <button @click="setView('bulk')" class="ds-card-action">Bulk scan →</button>
                </div>
                <div v-if="!monitors.length" class="ds-empty-state">
                  <p>No sites monitored</p>
                  <p class="ds-empty-hint">Scan a site and use Watch to monitor it daily.</p>
                </div>
                <div v-else>
                  <div v-for="m in monitors" :key="m._id" class="ds-monitor-row">
                    <div class="ds-monitor-dot" :style="{ background: scoreBg(m.lastScore) }"></div>
                    <div class="ds-monitor-info">
                      <div class="ds-monitor-domain">{{ hostname(m.url) }}</div>
                      <div class="ds-monitor-meta">{{ m.lastRunTime ? 'Checked ' + relativeTime(m.lastRunTime) : 'Not yet checked' }} · {{ m.frequency }}</div>
                    </div>
                    <div class="ds-monitor-score" :style="{ color: scoreBg(m.lastScore) }">
                      {{ m.lastScore ?? '—' }}
                      <span v-if="scoreTrend(m.url)" :style="{ color: trendColor(scoreTrend(m.url)) }">{{ scoreTrend(m.url) }}</span>
                    </div>
                    <div class="ds-monitor-actions">
                      <button @click="openScanByUrl(m.url)" class="ds-monitor-link">View →</button>
                      <button @click="toggleMonitor(m.url)" class="ds-monitor-stop">Stop</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Activity Feed</div>
                  <span class="ds-card-sub" :style="{ color: scans.some(s => s.status === 'running') ? '#ec3586' : '#6b7280' }">{{ scans.some(s => s.status === 'running') ? '● Live' : 'Recent' }}</span>
                </div>
                <div v-if="!scans.length" class="ds-empty-state"><p>No activity yet</p></div>
                <div v-else class="ds-activity-list">
                  <button v-for="scan in scans.slice(0, 8)" :key="scan._id" @click="openScan(scan)" class="ds-activity-item">
                    <div class="ds-activity-dot" :style="{ background: scan.status === 'done' ? scoreBg(scan.overallScore) : scan.status === 'running' ? '#ec3586' : scan.status === 'error' ? '#ff4757' : 'rgba(255,255,255,0.15)' }"></div>
                    <div class="ds-activity-text">
                      <span class="ds-activity-domain">{{ hostname(scan.url) }}</span>
                      <span v-if="scan.status === 'done'">complete — score {{ scan.overallScore ?? '?' }}</span>
                      <span v-else-if="scan.status === 'running'">scanning…</span>
                      <span v-else-if="scan.status === 'error'">failed</span>
                      <span v-else>queued</span>
                    </div>
                    <div class="ds-activity-time">{{ relativeTime(scan._creationTime) }}</div>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: HISTORY
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'history'">
            <div class="ds-history-toolbar">
              <input v-model="historySearch" class="ds-history-search" placeholder="Search URLs…" />
              <div class="ds-filter-tabs">
                <button v-for="f in ['all','pass','warning','critical']" :key="f" @click="filterStatus = f as any" class="ds-filter-tab" :class="{ 'ds-filter-active': filterStatus === f }">{{ f }}</button>
              </div>
              <span class="ds-history-count">{{ filteredHistoryScans.length }} scan{{ filteredHistoryScans.length !== 1 ? 's' : '' }}</span>
            </div>

            <div class="ds-card" style="padding:0;overflow:hidden;">
              <div v-if="!filteredHistoryScans.length" class="ds-empty-state" style="padding:40px 0;">
                <Logo :animate="false" class="ds-empty-logo" />
                <p>{{ scans.length ? 'No scans match the filter.' : 'No scans yet. Enter a URL above.' }}</p>
                <button v-if="scans.length" @click="filterStatus = 'all'; historySearch = ''" class="ds-empty-btn">Clear filters</button>
              </div>
              <button v-else v-for="scan in filteredHistoryScans" :key="scan._id" @click="openScan(scan)" class="ds-history-row">
                <div class="ds-history-status-dot" :class="{
                  'dot-pending': scan.status === 'pending',
                  'dot-running': scan.status === 'running',
                  'dot-done': scan.status === 'done',
                  'dot-error': scan.status === 'error',
                }"></div>
                <div class="ds-scan-fav">
                  <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" class="w-4 h-4 rounded" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
                </div>
                <div class="ds-scan-info">
                  <div class="ds-scan-domain">{{ scan.url }}</div>
                  <div class="ds-scan-time">{{ statusLabel(scan.status) }} · {{ relativeTime(scan._creationTime) }}</div>
                </div>
                <div v-if="scan.status === 'done'" class="ds-history-pillars">
                  <div v-for="[c, v] in [['#00d4aa', scan.securityScore],['#ffaa00', scan.performanceScore],['#6c5ce7', scan.seoScore]]" :key="String(c)" class="ds-mini-bar-wrap">
                    <div class="ds-mini-bar" :style="{ height: (Number(v) || 0) * 0.28 + 'px', background: String(c) }"></div>
                  </div>
                </div>
                <div class="ds-history-score" :style="{ color: scan.status === 'done' ? scoreBg(scan.overallScore) : 'rgba(255,255,255,0.2)' }">
                  {{ scan.status === 'done' ? (scan.overallScore ?? '—') : scan.status === 'running' ? '…' : '—' }}
                </div>
                <div class="ds-history-actions" @click.stop>
                  <button @click="reScan(scan.url)" class="ds-icon-btn" title="Re-scan">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5"/><path d="M4.93 19.07A10 10 0 0 0 20 12M19.07 4.93A10 10 0 0 0 4 12"/></svg>
                  </button>
                  <button @click="toggleMonitor(scan.url)" class="ds-icon-btn" :class="{ 'ds-icon-btn--active': isMonitored(scan.url) }" title="Toggle monitor">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button @click="deleteScan(scan._id)" class="ds-icon-btn ds-icon-btn--danger" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </button>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: COMPARE
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'compare'">
            <div class="ds-card">
              <div class="ds-card-header"><div class="ds-card-title">New Comparison</div></div>
              <div class="ds-compare-form">
                <div class="ds-compare-col">
                  <label class="ds-compare-label">Site A</label>
                  <input v-model="compareUrlA" class="ds-compare-input" placeholder="https://yoursite.com" />
                </div>
                <div class="ds-compare-vs">vs</div>
                <div class="ds-compare-col">
                  <label class="ds-compare-label">Site B (Competitor)</label>
                  <input v-model="compareUrlB" class="ds-compare-input" placeholder="https://competitor.com" />
                </div>
                <button @click="submitCompare" class="ds-compare-btn" :disabled="!compareUrlA.trim() || !compareUrlB.trim()">
                  Compare →
                </button>
              </div>
            </div>

            <div class="ds-card">
              <div class="ds-card-header"><div class="ds-card-title">Past Comparisons</div></div>
              <div v-if="!recentComparisons.length" class="ds-empty-state">
                <p>No comparisons yet</p>
                <p class="ds-empty-hint">Enter two URLs above to compare sites side by side.</p>
              </div>
              <NuxtLink v-else v-for="c in recentComparisons" :key="`${c.scanIdA}-${c.scanIdB}`" :to="`/compare/${c.scanIdA}/${c.scanIdB}`" class="ds-history-row ds-comparison-row">
                <div class="ds-scan-info">
                  <div class="ds-scan-domain">
                    <span style="color:#e8e8f0">{{ hostname(c.urlA) }}</span>
                    <span style="color:#6b7280;margin:0 8px;">vs</span>
                    <span style="color:#9898b0">{{ hostname(c.urlB) }}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: BULK SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'bulk'">
            <div class="ds-card">
              <div class="ds-card-header">
                <div class="ds-card-title">Bulk Scans</div>
                <NuxtLink to="/bulk-scan" class="ds-card-action">Open bulk scan tool →</NuxtLink>
              </div>
              <div v-if="!bulkScans.length" class="ds-empty-state">
                <p>No bulk scans yet</p>
                <p class="ds-empty-hint">Scan up to 50 URLs in a single job — Pro feature.</p>
                <NuxtLink to="/bulk-scan" class="ds-primary-btn" style="margin-top:12px;">Start a bulk scan</NuxtLink>
              </div>
              <template v-else>
                <NuxtLink v-for="b in bulkScans" :key="b._id" :to="`/bulk-scan/${b._id}`" class="ds-history-row">
                  <div class="ds-scan-info">
                    <div class="ds-scan-domain">{{ b.name }}</div>
                    <div class="ds-scan-time">{{ b.totalUrls }} URLs · {{ b.completedUrls }} complete</div>
                  </div>
                  <div v-if="b.status === 'running' || b.status === 'pending'" class="ds-bulk-progress">
                    <div class="ds-bulk-bar" :style="{ width: Math.round((b.completedUrls / b.totalUrls) * 100) + '%' }"></div>
                  </div>
                  <span class="ds-status-pill" :class="{
                    'ds-s-done': b.status === 'done',
                    'ds-s-running': b.status === 'running',
                    'ds-s-pending': b.status === 'pending',
                    'ds-s-error': b.status === 'error',
                  }">{{ b.status }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </template>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: SCAN
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'scan'">
            <div class="ds-scan-hero">
              <div class="ds-scan-hero-inner">
                <div class="ds-scan-hero-title">What site do you want to audit?</div>
                <div class="ds-scan-hero-sub">Analyze across Security, Performance, SEO, Accessibility, AI Readiness, DNS & Email, and Trust</div>
                <div class="ds-scan-hero-form">
                  <input v-model="newScanUrl" class="ds-scan-hero-input" placeholder="https://example.com" @keydown.enter="submitNewScan" />
                  <button class="ds-scan-hero-btn" @click="submitNewScan" :disabled="scanning || !newScanUrl.trim()">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
                    {{ scanning ? 'Scanning…' : 'Run Full Audit' }}
                  </button>
                </div>
                <div class="ds-pillar-chips">
                  <div v-for="[n, c] in [['Security','#00d4aa'],['Performance','#ffaa00'],['SEO','#6c5ce7'],['Accessibility','#a29bfe'],['AI Readiness','#ff7675'],['DNS & Email','#74b9ff'],['Trust','#fd79a8']]" :key="String(n)" class="ds-pillar-chip" :style="{ borderColor: String(c), color: String(c) }">{{ n }}</div>
                </div>
              </div>
            </div>

            <div v-if="doneScans.length" class="ds-card">
              <div class="ds-card-header">
                <div class="ds-card-title">Recently Scanned</div>
                <button @click="setView('history')" class="ds-card-action">All history →</button>
              </div>
              <div class="ds-scan-recent-grid">
                <button v-for="scan in doneScans.slice(0, 8)" :key="scan._id" @click="openScan(scan)" class="ds-scan-recent-card">
                  <div class="ds-scan-recent-fav">
                    <img v-if="faviconUrl(scan.url)" :src="faviconUrl(scan.url)!" loading="lazy" width="20" height="20" @error="($event.target as HTMLImageElement).style.display='none'" />
                    <span v-else>{{ hostname(scan.url).charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="ds-scan-recent-domain">{{ hostname(scan.url) }}</div>
                  <div class="ds-scan-recent-score" :style="{ color: scoreBg(scan.overallScore) }">{{ scan.overallScore ?? '—' }}</div>
                  <div class="ds-scan-recent-time">{{ relativeTime(scan._creationTime) }}</div>
                </button>
              </div>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHARTS
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'charts'">

            <!-- Stats strip -->
            <div class="ds-stats-row">
              <div class="ds-stat-card">
                <div class="ds-stat-label">Total Scans</div>
                <div class="ds-stat-value" style="color:#ec3586">{{ scans.length }}</div>
                <div class="ds-stat-delta">All time</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Completed</div>
                <div class="ds-stat-value" :style="{ color: '#00d4aa' }">{{ doneScans.length }}</div>
                <div class="ds-stat-delta">{{ scans.filter(s=>s.status==='error').length }} failed</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Avg Score</div>
                <div class="ds-stat-value" :style="{ color: avgScore != null ? scoreBg(avgScore) : 'rgba(255,255,255,0.2)' }">{{ avgScore ?? '—' }}</div>
                <div class="ds-stat-delta">Across all done scans</div>
              </div>
              <div class="ds-stat-card">
                <div class="ds-stat-label">Unique Sites</div>
                <div class="ds-stat-value" style="color:#6c5ce7">{{ new Set(doneScans.map(s=>s.url)).size }}</div>
                <div class="ds-stat-delta">{{ monitors.length }} monitored</div>
              </div>
            </div>

            <div class="ds-mid-grid">
              <!-- Scans per day bar chart -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Scans per Day (last 14 days)</div></div>
                <div v-if="!scans.length" class="ds-empty-state"><p>No scans yet</p></div>
                <div v-else class="ds-bar-chart">
                  <div class="ds-bar-chart-inner">
                    <div v-for="(day, i) in scansPerDay" :key="i" class="ds-bar-col">
                      <div class="ds-bar-value">{{ day.count || '' }}</div>
                      <div class="ds-bar-wrap">
                        <div class="ds-bar" :style="{ height: Math.max(day.count / Math.max(...scansPerDay.map(d=>d.count), 1) * 100, day.count ? 8 : 0) + '%', background: day.count ? '#ec3586' : '#1e1e28' }"></div>
                      </div>
                      <div class="ds-bar-label">{{ i % 2 === 0 ? day.label.split(' ')[1] : '' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Score distribution donut-style -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Score Distribution</div></div>
                <div v-if="!doneScans.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else class="ds-dist-chart">
                  <div v-for="bucket in scoreDistribution" :key="bucket.label" class="ds-dist-row">
                    <div class="ds-dist-label">{{ bucket.label }}</div>
                    <div class="ds-dist-bar-bg">
                      <div class="ds-dist-bar" :style="{ width: bucket.pct + '%', background: bucket.color }"></div>
                    </div>
                    <div class="ds-dist-count" :style="{ color: bucket.color }">{{ bucket.count }}</div>
                    <div class="ds-dist-pct">{{ bucket.pct }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ds-mid-grid">
              <!-- Avg pillar scores -->
              <div class="ds-card">
                <div class="ds-card-header"><div class="ds-card-title">Average Score per Pillar</div></div>
                <div v-if="!doneScans.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else class="ds-pillars-grid">
                  <div v-for="p in avgPillarScores" :key="p.name" class="ds-pillar-row">
                    <div class="ds-pillar-dot" :style="{ background: p.color }"></div>
                    <div class="ds-pillar-name">{{ p.name }}</div>
                    <div class="ds-pillar-bar-bg"><div class="ds-pillar-bar" :style="{ width: (p.score || 0) + '%', background: p.color }"></div></div>
                    <div class="ds-pillar-score" :style="{ color: p.score ? p.color : 'rgba(255,255,255,0.2)' }">{{ p.score || '—' }}</div>
                  </div>
                </div>
              </div>

              <!-- Top sites -->
              <div class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Most Scanned Sites</div>
                  <span class="ds-card-sub">{{ topSites.length }} sites</span>
                </div>
                <div v-if="!topSites.length" class="ds-empty-state"><p>No completed scans</p></div>
                <div v-else>
                  <button v-for="site in topSites" :key="site.url" @click="openScanByUrl(site.url)" class="ds-top-site-row">
                    <div class="ds-scan-fav">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="ds-scan-info">
                      <div class="ds-scan-domain">{{ hostname(site.url) }}</div>
                      <div class="ds-scan-time">{{ site.count }} scan{{ site.count !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="ds-top-site-score" :style="{ color: scoreBg(site.latestScore ?? undefined) }">{{ site.latestScore ?? '—' }}</div>
                    <div class="ds-top-site-sparkline">
                      <svg width="60" height="24" viewBox="0 0 60 24">
                        <template v-if="urlSparklines.get(site.url)?.length">
                          <polyline
                            :points="urlSparklines.get(site.url)!.map((v, i, arr) => `${i / (arr.length - 1) * 60},${24 - v / 100 * 22}`).join(' ')"
                            fill="none"
                            :stroke="scoreBg(site.latestScore ?? undefined)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </template>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Per-site score history charts -->
            <div v-if="urlCharts.length" class="cht-section">
              <div class="cht-section-head">
                <span class="cht-section-title">Score History per Site</span>
                <span class="cht-section-sub">{{ urlCharts.length }} site{{ urlCharts.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="cht-grid">
                <div v-for="site in urlCharts" :key="site.url" class="cht-card" @click="openChartDetail(site.url)">

                  <!-- Card header -->
                  <div class="cht-card-head">
                    <div class="ds-scan-fav">
                      <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" loading="lazy" width="16" height="16" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span v-else>{{ hostname(site.url).charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="cht-card-meta">
                      <div class="cht-card-host">{{ hostname(site.url) }}</div>
                      <div class="cht-card-count">{{ site.points.length }} scan{{ site.points.length !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="cht-card-score" :style="{ color: scoreColor(site.latest.score) }">{{ site.latest.score }}</div>
                  </div>

                  <!-- SVG line chart -->
                  <div class="cht-chart-wrap">
                    <svg viewBox="0 0 300 80" preserveAspectRatio="none" class="cht-svg" xmlns="http://www.w3.org/2000/svg">
                      <!-- Grid lines at 25 / 50 / 75 -->
                      <line x1="0" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="23" x2="300" y2="23" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="36" x2="300" y2="36" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <line x1="0" y1="49" x2="300" y2="49" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                      <!-- Area fill (multi-point only) -->
                      <path v-if="site.points.length > 1"
                        :d="chartAreaPath(site.points.map(p => p.score))"
                        :fill="`${scoreColor(site.latest.score)}18`"
                      />
                      <!-- Line (multi-point only) -->
                      <polyline v-if="site.points.length > 1"
                        :points="chartSvgPoints(site.points.map(p => p.score))"
                        fill="none"
                        :stroke="scoreColor(site.latest.score)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Dots + score labels -->
                      <g v-for="(pt, i) in site.points" :key="i">
                        <circle
                          :cx="chartDotX(i, site.points.length)"
                          :cy="chartDotY(pt.score)"
                          r="3.5"
                          :fill="scoreColor(pt.score)"
                          stroke="#0f0f14"
                          stroke-width="1.5"
                        />
                        <text
                          v-if="site.points.length <= 8 || i === site.points.length - 1"
                          :x="chartDotX(i, site.points.length)"
                          :y="chartDotY(pt.score) - 8"
                          text-anchor="middle"
                          font-size="8.5"
                          font-family="Space Grotesk, sans-serif"
                          font-weight="700"
                          :fill="scoreColor(pt.score)"
                        >{{ pt.score }}</text>
                        <!-- Date label on first + last when multi-point -->
                        <text
                          v-if="site.points.length > 1 && (i === 0 || i === site.points.length - 1)"
                          :x="chartDotX(i, site.points.length)"
                          y="76"
                          text-anchor="middle"
                          font-size="7.5"
                          font-family="DM Sans, sans-serif"
                          fill="rgba(255,255,255,0.28)"
                        >{{ shortDate(pt.time) }}</text>
                      </g>
                    </svg>
                  </div>

                  <!-- Pillar bars -->
                  <div class="cht-pillars">
                    <div v-if="site.latest.securityScore != null" class="cht-pillar">
                      <span class="cht-p-label">Sec</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.securityScore + '%', background: '#00d4aa' }"/></div>
                      <span class="cht-p-val" style="color:#00d4aa">{{ site.latest.securityScore }}</span>
                    </div>
                    <div v-if="site.latest.performanceScore != null" class="cht-pillar">
                      <span class="cht-p-label">Perf</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.performanceScore + '%', background: '#ffaa00' }"/></div>
                      <span class="cht-p-val" style="color:#ffaa00">{{ site.latest.performanceScore }}</span>
                    </div>
                    <div v-if="site.latest.seoScore != null" class="cht-pillar">
                      <span class="cht-p-label">SEO</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.seoScore + '%', background: '#6c5ce7' }"/></div>
                      <span class="cht-p-val" style="color:#6c5ce7">{{ site.latest.seoScore }}</span>
                    </div>
                    <div v-if="site.latest.accessibilityScore != null" class="cht-pillar">
                      <span class="cht-p-label">A11y</span>
                      <div class="cht-p-bar-bg"><div class="cht-p-bar" :style="{ width: site.latest.accessibilityScore + '%', background: '#a29bfe' }"/></div>
                      <span class="cht-p-val" style="color:#a29bfe">{{ site.latest.accessibilityScore }}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: CHART DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'chart-detail' && selectedChartUrl">
            <div v-if="!chartDetailScans.length" class="ds-empty-state"><p>No completed scans for this site.</p></div>
            <div v-else class="cd-wrap">

              <!-- Hero header -->
              <div class="cd-hero">
                <div class="ds-scan-fav cd-fav">
                  <img v-if="faviconUrl(selectedChartUrl)" :src="faviconUrl(selectedChartUrl)!" loading="lazy" width="20" height="20" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else>{{ hostname(selectedChartUrl).charAt(0).toUpperCase() }}</span>
                </div>
                <div class="cd-hero-meta">
                  <div class="cd-hero-host">{{ hostname(selectedChartUrl) }}</div>
                  <div class="cd-hero-url">{{ selectedChartUrl }}</div>
                </div>
                <div class="cd-hero-stats">
                  <div class="cd-hero-stat">
                    <div class="cd-hero-stat-val" :style="{ color: scoreColor(chartDetailLatest?.overallScore) }">{{ chartDetailLatest?.overallScore ?? '—' }}</div>
                    <div class="cd-hero-stat-label">Latest score</div>
                  </div>
                  <div class="cd-hero-stat">
                    <div class="cd-hero-stat-val" style="color:rgba(255,255,255,0.7)">{{ chartDetailScans.length }}</div>
                    <div class="cd-hero-stat-label">Scans</div>
                  </div>
                  <div class="cd-hero-stat" v-if="chartDetailScans.length >= 2">
                    <div class="cd-hero-stat-val" :style="{ color: chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '#00d4aa' : '#ff4757' }">
                      {{ chartDetailScans[chartDetailScans.length-1].overallScore >= chartDetailScans[0].overallScore ? '↑' : '↓' }}{{ Math.abs(chartDetailScans[chartDetailScans.length-1].overallScore - chartDetailScans[0].overallScore) }}
                    </div>
                    <div class="cd-hero-stat-label">Since first scan</div>
                  </div>
                </div>
                <button class="cd-view-result-btn" @click="openScanByUrl(selectedChartUrl)">View latest result →</button>
              </div>

              <!-- Large overall chart -->
              <div class="ds-card cd-main-chart-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Overall Score Over Time</div>
                  <span class="ds-card-sub">{{ chartDetailScans.length }} data point{{ chartDetailScans.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="cd-main-chart-wrap">
                  <svg :viewBox="`0 0 ${CD_W} ${CD_H}`" preserveAspectRatio="xMidYMid meet" class="cd-main-svg" xmlns="http://www.w3.org/2000/svg">
                    <!-- Y-axis grid lines + labels -->
                    <g v-for="g in CD_GRID" :key="g">
                      <line :x1="CD_PL" :y1="cdY(g)" :x2="CD_W - CD_PR" :y2="cdY(g)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                      <text :x="CD_PL - 6" :y="cdY(g) + 3.5" text-anchor="end" font-size="9" font-family="DM Sans,sans-serif" fill="rgba(255,255,255,0.22)">{{ g }}</text>
                    </g>
                    <!-- Area fill -->
                    <path v-if="chartDetailScans.length > 1"
                      :d="cdAreaPath(chartDetailScans.map((s:any) => s.overallScore))"
                      :fill="`${scoreColor(chartDetailLatest?.overallScore)}18`"
                    />
                    <!-- Line -->
                    <polyline v-if="chartDetailScans.length > 1"
                      :points="cdPolyline(chartDetailScans.map((s:any) => s.overallScore))"
                      fill="none"
                      :stroke="scoreColor(chartDetailLatest?.overallScore)"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <!-- Dots, score labels, date labels -->
                    <g v-for="(scan, i) in chartDetailScans" :key="scan._id">
                      <!-- Score label above dot -->
                      <text
                        :x="cdX(i, chartDetailScans.length)"
                        :y="cdY(scan.overallScore) - 9"
                        text-anchor="middle"
                        font-size="10"
                        font-family="Space Grotesk, sans-serif"
                        font-weight="700"
                        :fill="scoreColor(scan.overallScore)"
                      >{{ scan.overallScore }}</text>
                      <!-- Dot -->
                      <circle
                        :cx="cdX(i, chartDetailScans.length)"
                        :cy="cdY(scan.overallScore)"
                        r="4.5"
                        :fill="scoreColor(scan.overallScore)"
                        stroke="#0f0f14"
                        stroke-width="2"
                      />
                      <!-- Date label below axis -->
                      <text
                        v-if="chartDetailScans.length <= 12 || i === 0 || i === chartDetailScans.length - 1 || i % Math.ceil(chartDetailScans.length / 8) === 0"
                        :x="cdX(i, chartDetailScans.length)"
                        :y="CD_H - 4"
                        text-anchor="middle"
                        font-size="9"
                        font-family="DM Sans, sans-serif"
                        fill="rgba(255,255,255,0.3)"
                      >{{ shortDate(scan._creationTime) }}</text>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- Per-pillar charts grid -->
              <div v-if="chartDetailPillars.length" class="cd-pillars-section">
                <div class="cht-section-head">
                  <span class="cht-section-title">Pillar Breakdown</span>
                  <span class="cht-section-sub">scores from latest scan</span>
                </div>
                <div class="cd-pillars-grid">
                  <div v-for="p in chartDetailPillars" :key="p.key" class="cd-pillar-card">
                    <div class="cd-pillar-card-head">
                      <div class="cd-pillar-dot" :style="{ background: p.color }"/>
                      <span class="cd-pillar-name">{{ p.label }}</span>
                      <span class="cd-pillar-score" :style="{ color: p.color }">{{ p.latest ?? '—' }}</span>
                    </div>
                    <!-- Pillar trend using TrendChart -->
                    <TrendChart
                      v-if="p.scores.length >= 2"
                      :data="p.scores"
                      :color="p.color"
                      :width="240"
                      :height="52"
                      :show-dots="true"
                      :show-tooltip="true"
                    />
                    <div v-else-if="p.scores.length === 1" class="cd-pillar-single">
                      <div class="cd-pillar-bar-bg">
                        <div class="cd-pillar-bar" :style="{ width: (p.latest ?? 0) + '%', background: p.color }"/>
                      </div>
                      <span class="cd-pillar-bar-val" :style="{ color: p.color }">{{ p.latest }}/100</span>
                    </div>
                    <div class="cd-pillar-card-foot">
                      <span class="cd-pillar-scan-count">{{ p.scores.length }} scan{{ p.scores.length !== 1 ? 's' : '' }}</span>
                      <span v-if="p.scores.length >= 2" class="cd-pillar-delta" :style="{ color: p.scores[p.scores.length-1] >= p.scores[0] ? '#00d4aa' : '#ff4757' }">
                        {{ p.scores[p.scores.length-1] >= p.scores[0] ? '+' : '' }}{{ p.scores[p.scores.length-1] - p.scores[0] }} vs first
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Scan log table -->
              <div class="ds-card cd-log-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Scan Log</div>
                  <span class="ds-card-sub">{{ chartDetailScans.length }} scans — most recent first</span>
                </div>
                <div class="cd-log-wrap">
                  <table class="cd-log-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Overall</th>
                        <th>Security</th>
                        <th>Performance</th>
                        <th>SEO</th>
                        <th>A11y</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="scan in [...chartDetailScans].reverse()" :key="scan._id">
                        <td class="cd-log-date">{{ shortDate(scan._creationTime) }}</td>
                        <td><span class="cd-log-score" :style="{ color: scoreColor(scan.overallScore), borderColor: scoreColor(scan.overallScore) + '30', background: scoreColor(scan.overallScore) + '12' }">{{ scan.overallScore ?? '—' }}</span></td>
                        <td><span v-if="scan.securityScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.securityScore) }">{{ scan.securityScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.performanceScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.performanceScore) }">{{ scan.performanceScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.seoScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.seoScore) }">{{ scan.seoScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><span v-if="scan.accessibilityScore != null" class="cd-log-pill" :style="{ color: scoreColor(scan.accessibilityScore) }">{{ scan.accessibilityScore }}</span><span v-else class="cd-log-na">—</span></td>
                        <td><button class="cd-log-view" @click="openScan(scan)">View →</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: TOOLS
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'tools'">

            <!-- Filter tabs -->
            <div class="tl-tabs">
              <button
                v-for="p in toolPillars" :key="p.key"
                class="tl-tab"
                :class="{ 'tl-tab--active': toolsFilter === p.key }"
                :style="toolsFilter === p.key ? `--tc:${p.color}` : ''"
                @click="toolsFilter = p.key"
              >
                <span v-if="p.key !== 'all'" class="tl-tdot" :style="`background:${p.color}`"/>
                {{ p.label }}
                <span class="tl-tcount">{{ toolsPillarCount(p.key) }}</span>
              </button>
            </div>

            <TransitionGroup name="tl-fade">

              <!-- Featured card -->
              <div
                v-if="toolsFeatured"
                :key="'feat-' + toolsFeatured.slug"
                class="tl-feat"
                :style="`--pc:${toolsFeatured.color}`"
                @click="openTool(toolsFeatured.slug)"
              >
                <div class="tl-feat-shimmer" />
                <div class="tl-feat-glow" :style="`background:radial-gradient(ellipse at 75% 50%, ${toolsFeatured.color}1a 0%, transparent 65%)`" />
                <div class="tl-feat-deco" :style="`color:${toolsFeatured.color}`">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon"/>
                </div>
                <div class="tl-feat-body">
                  <div class="tl-feat-top">
                    <div class="tl-feat-ring" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}15;border-color:${toolsFeatured.color}30`">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" v-html="toolsFeatured.icon"/>
                    </div>
                    <div class="tl-feat-badges">
                      <span class="tl-fbadge" :style="`color:${toolsFeatured.color};background:${toolsFeatured.color}12;border-color:${toolsFeatured.color}30`">{{ toolsFeatured.pillar }}</span>
                      <span class="tl-fbadge tl-fbadge--free">Free</span>
                      <span class="tl-fbadge tl-fbadge--feat">Featured</span>
                    </div>
                  </div>
                  <h2 class="tl-feat-title">{{ toolsFeatured.title }}</h2>
                  <p class="tl-feat-desc">{{ toolsFeatured.desc }}</p>
                  <div class="tl-feat-foot">
                    <span class="tl-feat-checks" :style="`color:${toolsFeatured.color}`">
                      {{ toolsFeatured.fixes ? `✓ Fixes ${toolsFeatured.fixes} scan checks` : '✓ WCAG accessibility' }}
                    </span>
                    <span class="tl-feat-cta" :style="`background:${toolsFeatured.color};color:#07070a`">Open tool →</span>
                  </div>
                </div>
              </div>

              <!-- Rest grid -->
              <div v-if="toolsRest.length" key="rest-grid" class="tl-rest-grid">
                <div
                  v-for="(t, i) in toolsRest"
                  :key="t.slug"
                  class="tl-rcard"
                  :style="`--pc:${t.color};--i:${i}`"
                  @click="openTool(t.slug)"
                >
                  <div class="tl-rcard-accent" :style="`background:${t.color}`" />
                  <div class="tl-rcard-inner">
                    <div class="tl-rcard-head">
                      <div class="tl-rcard-icon" :style="`color:${t.color};background:${t.color}12;border:1px solid ${t.color}25`">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"/>
                      </div>
                      <span class="tl-rcard-pillar" :style="`color:${t.color}`">{{ t.pillar }}</span>
                      <span class="tl-rcard-free">Free</span>
                    </div>
                    <h3 class="tl-rcard-title">{{ t.title }}</h3>
                    <p class="tl-rcard-desc">{{ t.short }}</p>
                    <div class="tl-rcard-foot">
                      <span class="tl-rcard-checks" :style="`color:${t.color};background:${t.color}10;border:1px solid ${t.color}20`">
                        {{ t.fixes ? `${t.fixes} checks` : 'WCAG' }}
                      </span>
                      <span class="tl-rcard-cta">Open →</span>
                    </div>
                  </div>
                </div>
              </div>

            </TransitionGroup>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: TOOL DETAIL
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'tool-detail' && currentToolComponent">
            <div class="ds-tool-detail">
              <Suspense>
                <component :is="currentToolComponent" />
                <template #fallback>
                  <div class="ds-tool-loading">
                    <div class="ds-tool-loading-dot" />
                    <span>Loading tool…</span>
                  </div>
                </template>
              </Suspense>
            </div>
          </template>

          <!-- ══════════════════════════════════════════════
               VIEW: RESULT
          ══════════════════════════════════════════════════ -->
          <template v-else-if="currentView === 'result' && selectedScan">

            <!-- ── Scanning state ───────────────────────── -->
            <div v-if="selectedScan.status === 'pending' || selectedScan.status === 'running'" class="rs-scanning">
              <div class="rs-scan-rings">
                <div class="rs-ring rs-ring-1"/>
                <div class="rs-ring rs-ring-2"/>
                <div class="rs-ring rs-ring-3"/>
                <div class="rs-ring rs-ring-spin"/>
                <div class="rs-ring-dot"/>
              </div>
              <div class="rs-scan-label">{{ selectedScan.status === 'running' ? 'Scanning…' : 'Initialising…' }}</div>
              <div class="rs-scan-url">{{ selectedScan.url }}</div>
              <div class="rs-scan-sub">Running 94 checks across security, performance, SEO, accessibility, AI readiness, DNS &amp; trust</div>
              <div class="rs-scan-dots">
                <div class="rs-scan-dot" style="animation-delay:0s"/>
                <div class="rs-scan-dot" style="animation-delay:0.2s"/>
                <div class="rs-scan-dot" style="animation-delay:0.4s"/>
              </div>
            </div>

            <!-- ── Error state ──────────────────────────── -->
            <div v-else-if="selectedScan.status === 'error'" class="rs-error">
              <div class="rs-error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div class="rs-error-title">Scan failed</div>
              <div class="rs-error-msg">{{ selectedScan.errorMessage ?? 'Something went wrong.' }}</div>
              <button class="rs-retry-btn" @click="handleScan(selectedScan.url)">Try again</button>
            </div>

            <!-- ── Done state ───────────────────────────── -->
            <div v-else class="ds-result-layout">

              <!-- Score hero -->
              <div class="ds-card ds-result-hero">
                <div class="ds-result-ring-wrap">
                  <svg width="120" height="120" viewBox="0 0 120 120" style="transform:rotate(-90deg)">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1e1e28" stroke-width="10"/>
                    <circle v-if="selectedScan.overallScore"
                      cx="60" cy="60" r="50" fill="none"
                      :stroke="scoreBg(selectedScan.overallScore)" stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="`${(selectedScan.overallScore / 100) * 314} 314`"
                    />
                  </svg>
                  <div class="ds-result-ring-num">
                    <div class="ds-result-big-score" :style="{ color: scoreBg(selectedScan.overallScore) }">{{ selectedScan.overallScore ?? '—' }}</div>
                    <div class="ds-result-score-label">/100</div>
                  </div>
                </div>
                <div class="ds-result-meta">
                  <div class="ds-result-url">{{ selectedScan.url }}</div>
                  <div class="ds-result-time">Scanned {{ relativeTime(selectedScan._creationTime) }}</div>
                  <div class="ds-result-status-row">
                    <span class="ds-status-pill ds-s-done">Complete</span>
                    <span v-if="isMonitored(selectedScan.url)" class="ds-monitored-tag">● Monitored</span>
                  </div>
                  <div class="ds-result-actions">
                    <button @click="reScan(selectedScan.url)" class="ds-action-btn">Re-scan</button>
                    <button @click="toggleMonitor(selectedScan.url)" class="ds-action-btn" :class="{ 'ds-action-btn--active': isMonitored(selectedScan.url) }">
                      {{ isMonitored(selectedScan.url) ? 'Stop monitoring' : 'Monitor' }}
                    </button>
                    <button @click="shareResult()" class="ds-action-btn">{{ resultCopied ? 'Copied!' : 'Share' }}</button>
                    <button @click="deleteScan(selectedScan._id)" class="ds-action-btn ds-action-btn--danger">Delete</button>
                  </div>
                </div>
              </div>

              <!-- 7 Pillar scores -->
              <div class="rs-pillars-grid">
                <div v-for="[name, val, color, bonus] in [
                  ['Security',      selectedScan.securityScore,      '#00d4aa', false],
                  ['Performance',   selectedScan.performanceScore,   '#ffaa00', false],
                  ['SEO',           selectedScan.seoScore,           '#6c5ce7', false],
                  ['Accessibility', selectedScan.accessibilityScore, '#a29bfe', false],
                  ['AI Readiness',  selectedScan.aiScore,            '#ff7675', false],
                  ['DNS & Email',   selectedScan.dnsScore,           '#74b9ff', true],
                  ['Trust',         selectedScan.trustScore,         '#fd79a8', true],
                ]" :key="String(name)" class="rs-pillar-card" :style="`--pc:${color}`">
                  <div class="rs-pillar-card-top"/>
                  <div class="rs-pillar-card-glow"/>
                  <div class="rs-pillar-label">
                    {{ name }}
                    <span v-if="bonus" class="rs-pillar-bonus">bonus</span>
                  </div>
                  <div class="rs-pillar-score" :style="{ color: val != null ? String(color) : 'rgba(255,255,255,0.18)' }">{{ val ?? '—' }}</div>
                  <div class="rs-pillar-bar-bg">
                    <div class="rs-pillar-bar" :style="{ width: (Number(val) || 0) + '%', background: String(color) }"/>
                  </div>
                </div>
              </div>

              <!-- Issues section -->
              <div class="ds-card" v-if="selectedScan.issues?.length">
                <div class="ds-card-header">
                  <div class="ds-card-title">Issues <span class="rs-issue-total">{{ selectedScan.issues.length }}</span></div>
                </div>
                <!-- Tab bar -->
                <div class="rs-tabs">
                  <button
                    v-for="tab in resultIssueTabs" :key="tab"
                    class="rs-tab"
                    :class="{ 'rs-tab--active': resultActiveTab === tab }"
                    @click="resultActiveTab = tab; resultExpandedFix = null"
                  >
                    {{ tab === 'all' ? 'All' : tab === 'seo' ? 'SEO' : tab === 'ai' ? 'AI' : tab === 'dns' ? 'DNS' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
                    <span v-if="issueTabCount(tab)" class="rs-tab-count">{{ issueTabCount(tab) }}</span>
                  </button>
                </div>
                <!-- Issue list -->
                <div class="rs-issues">
                  <div v-for="issue in resultIssues" :key="issue.title" class="rs-issue">
                    <button class="rs-issue-head" @click="resultExpandedFix = resultExpandedFix === issue.title ? null : issue.title">
                      <span class="rs-sev" :class="`rs-sev--${issue.severity}`">{{ issue.severity }}</span>
                      <span class="rs-issue-title">{{ issue.title }}</span>
                      <span class="rs-issue-pillar" :style="pillarColor(issue.pillar)">{{ issue.pillar }}</span>
                      <span v-if="FIX_SNIPPETS[issue.title]" class="rs-fix-badge">Fix →</span>
                      <svg class="rs-issue-chevron" :class="{ open: resultExpandedFix === issue.title }" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="resultExpandedFix === issue.title" class="rs-issue-body">
                      <p class="rs-issue-desc">{{ issue.description }}</p>
                      <div v-if="FIX_SNIPPETS[issue.title]" class="rs-snippet">
                        <pre class="rs-pre">{{ FIX_SNIPPETS[issue.title].generic }}</pre>
                      </div>
                      <button v-if="TOOL_LINKS[issue.title]" class="rs-tool-link" @click="dashboardNavigate(TOOL_LINKS[issue.title])">
                        Fix with {{ allTools.find(t => TOOL_LINKS[issue.title]?.endsWith(t.slug))?.title ?? 'tool' }} →
                      </button>
                    </div>
                  </div>
                  <div v-if="!resultIssues.length" class="ds-empty-state"><p>No issues in this category</p></div>
                </div>
              </div>

              <!-- No issues -->
              <div v-else-if="selectedScan.status === 'done'" class="ds-card">
                <div style="padding:12px 0;text-align:center;color:#00d4aa;font-family:'Space Grotesk',sans-serif;font-weight:700;">✓ No issues found</div>
              </div>

              <!-- Other scans of same site -->
              <div v-if="scans.filter((s:any) => s.url === selectedScan.url && s._id !== selectedScan._id).length" class="ds-card">
                <div class="ds-card-header">
                  <div class="ds-card-title">Previous scans of {{ hostname(selectedScan.url) }}</div>
                </div>
                <button v-for="s in scans.filter((s:any) => s.url === selectedScan.url && s._id !== selectedScan._id).slice(0, 5)" :key="s._id" @click="openScan(s)" class="ds-scan-item">
                  <div class="ds-scan-info">
                    <div class="ds-scan-domain">{{ relativeTime(s._creationTime) }}</div>
                    <div class="ds-scan-time">{{ statusLabel(s.status) }}</div>
                  </div>
                  <span class="ds-scan-score" :style="{ color: scoreBg(s.overallScore) }">{{ s.overallScore ?? '—' }}</span>
                </button>
              </div>

            </div>
          </template>

        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────────── */
.ds-shell {
  display: flex;
  height: 100vh;
  padding-top: 62px;
  overflow: hidden;
  background: #07070a;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
}

/* ── Sidebar ──────────────────────────────────────────── */
.ds-sidebar {
  width: 220px; flex-shrink: 0;
  background: #0f0f14;
  border-right: 1px solid #1e1e28;
  display: flex; flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;
}
.ds-sidebar::-webkit-scrollbar { display: none; }
.ds-logo { padding: 18px 16px; border-bottom: 1px solid #1e1e28; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ds-logo-inner { display: flex; align-items: center; gap: 9px; text-decoration: none; }
.ds-logo-mark { width: 26px; height: 26px; background: #ec3586; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ds-logo-mark svg { width: 15px; height: 15px; }
.ds-logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; color: #e8e8f0; }
.ds-plan-badge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-left: auto; }
.ds-plan-pro { background: rgba(236,53,134,0.12); color: #ec3586; border: 1px solid rgba(236,53,134,0.25); }
.ds-plan-free { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }

.ds-nav-section { padding: 8px 16px 4px; font-size: 9px; font-weight: 700; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; }
.ds-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 16px; color: #9898b0; font-size: 13px;
  text-decoration: none; background: none; border: none; border-left: 2px solid transparent;
  width: 100%; text-align: left; cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.ds-nav-item:hover { color: #e8e8f0; background: rgba(255,255,255,0.04); }
.ds-nav-active { color: #e8e8f0 !important; background: rgba(236,53,134,0.08) !important; border-left-color: #ec3586 !important; }
.ds-nav-item svg { width: 14px; height: 14px; opacity: 0.7; flex-shrink: 0; }
.ds-nav-badge { margin-left: auto; font-size: 10px; background: #ec3586; color: white; border-radius: 10px; padding: 1px 6px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; }
.ds-nav-count { margin-left: auto; font-size: 10px; color: #9898b0; background: #16161e; border: 1px solid #1e1e28; border-radius: 4px; padding: 1px 5px; }
.ds-site-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ds-site-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.ds-nav-empty { padding: 6px 16px; font-size: 11px; color: rgba(255,255,255,0.2); }

.ds-user { padding: 14px 16px; border-top: 1px solid #1e1e28; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ds-user-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #ec3586, #8b1a5e); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; font-family: 'Space Grotesk', sans-serif; }
.ds-user-info { min-width: 0; }
.ds-user-plan { font-size: 12px; font-weight: 600; color: #e8e8f0; font-family: 'Space Grotesk', sans-serif; }
.ds-user-sub { font-size: 10px; color: #6b7280; margin-top: 1px; }

/* ── Main ─────────────────────────────────────────────── */
.ds-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.ds-topbar { height: 56px; background: #0f0f14; border-bottom: 1px solid #1e1e28; display: flex; align-items: center; padding: 0 22px; gap: 16px; flex-shrink: 0; }
.ds-topbar-left { display: flex; align-items: center; gap: 10px; }
.ds-back-btn { background: none; border: 1px solid #1e1e28; border-radius: 7px; padding: 5px 8px; color: #9898b0; cursor: pointer; display: flex; align-items: center; transition: color 0.1s, border-color 0.1s; }
.ds-back-btn:hover { color: #e8e8f0; border-color: rgba(255,255,255,0.15); }
.ds-topbar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; color: #e8e8f0; }
.ds-topbar-sub { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-topbar-spacer { flex: 1; }
.ds-scan-row { display: flex; align-items: center; gap: 8px; }
.ds-scan-input { background: #16161e; border: 1px solid #1e1e28; border-radius: 8px; padding: 7px 14px; color: #e8e8f0; font-size: 13px; width: 260px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-scan-input::placeholder { color: #6b7280; }
.ds-scan-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-scan-btn { background: #ec3586; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; white-space: nowrap; }
.ds-scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ds-scan-btn:hover:not(:disabled) { opacity: 0.9; }

/* ── Content ──────────────────────────────────────────── */
.ds-content { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 18px; scrollbar-width: thin; scrollbar-color: rgba(236,53,134,0.3) transparent; }
.ds-content::-webkit-scrollbar { width: 4px; }
.ds-content::-webkit-scrollbar-track { background: transparent; }
.ds-content::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.3); border-radius: 4px; transition: background 0.2s; }
.ds-content::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.6); }
.ds-nav { padding: 12px 0; flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(236,53,134,0.2) transparent; }
.ds-nav::-webkit-scrollbar { width: 3px; }
.ds-nav::-webkit-scrollbar-track { background: transparent; }
.ds-nav::-webkit-scrollbar-thumb { background: rgba(236,53,134,0.2); border-radius: 4px; }
.ds-nav::-webkit-scrollbar-thumb:hover { background: rgba(236,53,134,0.45); }
.ds-skeleton { background: rgba(255,255,255,0.03); animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Stats */
.ds-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.ds-stat-card { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 12px; padding: 16px; }
.ds-stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif; }
.ds-stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; line-height: 1; }
.ds-stat-delta { font-size: 11px; color: #6b7280; margin-top: 5px; }
.ds-stat-link { color: #ec3586; background: none; border: none; cursor: pointer; font-size: 11px; padding: 0; }
.ds-stat-link:hover { opacity: 0.8; }

/* Grids */
.ds-mid-grid { display: grid; grid-template-columns: 1fr 300px; gap: 18px; }
.ds-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

/* Card */
.ds-card { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 12px; padding: 18px; }
.ds-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ds-card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13px; color: #e8e8f0; }
.ds-card-action { font-size: 12px; color: #ec3586; text-decoration: none; cursor: pointer; background: none; border: none; transition: opacity 0.15s; padding: 0; }
.ds-card-action:hover { opacity: 0.75; }
.ds-card-sub { font-size: 11px; color: #6b7280; }

/* Pillar rows */
.ds-pillars-grid { display: flex; flex-direction: column; gap: 10px; }
.ds-pillar-row { display: flex; align-items: center; gap: 10px; }
.ds-pillar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ds-pillar-name { font-size: 12px; color: #9898b0; width: 90px; flex-shrink: 0; }
.ds-pillar-bar-bg { flex: 1; height: 5px; background: #1e1e28; border-radius: 3px; overflow: hidden; }
.ds-pillar-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; min-width: 2px; }
.ds-pillar-score { font-size: 12px; font-weight: 600; width: 28px; text-align: right; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }

/* Scan items (button version) */
.ds-scan-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid #1e1e28;
  background: none; border-left: none; border-right: none; border-top: none;
  width: 100%; text-align: left; cursor: pointer;
  transition: opacity 0.15s;
}
.ds-scan-item:last-child { border-bottom: none; padding-bottom: 0; }
.ds-scan-item:hover { opacity: 0.75; }
.ds-scan-fav { width: 28px; height: 28px; background: #16161e; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #9898b0; flex-shrink: 0; overflow: hidden; }
.ds-scan-info { flex: 1; min-width: 0; }
.ds-scan-domain { font-size: 13px; font-weight: 500; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ds-scan-time { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-scan-right { flex-shrink: 0; }
.ds-scan-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; }
.ds-scan-running { color: #ec3586; animation: pingpulse 1s infinite; }
@keyframes pingpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Monitor rows */
.ds-monitor-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #1e1e28; }
.ds-monitor-row:last-child { border-bottom: none; }
.ds-monitor-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ds-monitor-info { flex: 1; min-width: 0; }
.ds-monitor-domain { font-size: 13px; font-weight: 500; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ds-monitor-meta { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-monitor-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 4px; }
.ds-monitor-actions { display: flex; gap: 8px; align-items: center; }
.ds-monitor-link { font-size: 12px; color: #9898b0; background: none; border: none; cursor: pointer; transition: color 0.1s; padding: 0; }
.ds-monitor-link:hover { color: #e8e8f0; }
.ds-monitor-stop { font-size: 11px; color: rgba(255,71,87,0.4); background: none; border: none; cursor: pointer; transition: color 0.1s; padding: 0; }
.ds-monitor-stop:hover { color: #ff4757; }

/* Activity */
.ds-activity-list { display: flex; flex-direction: column; }
.ds-activity-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1e1e28; font-size: 12px; color: #9898b0; background: none; border-left: none; border-right: none; border-top: none; width: 100%; text-align: left; cursor: pointer; transition: opacity 0.15s; }
.ds-activity-item:last-child { border-bottom: none; }
.ds-activity-item:hover { opacity: 0.8; }
.ds-activity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ds-activity-text { flex: 1; }
.ds-activity-domain { color: #e8e8f0; font-weight: 500; margin-right: 4px; }
.ds-activity-time { font-size: 11px; color: #6b7280; flex-shrink: 0; }

/* Status pills */
.ds-status-pill { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 7px; border-radius: 4px; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }
.ds-s-done    { background: rgba(0,212,170,0.1);   color: #00d4aa; }
.ds-s-running { background: rgba(236,53,134,0.1);  color: #ec3586; }
.ds-s-pending { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); }
.ds-s-error   { background: rgba(255,71,87,0.1);   color: #ff4757; }

/* Empty states */
.ds-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0; color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; gap: 6px; }
.ds-empty-logo { width: 32px; height: 32px; opacity: 0.15; }
.ds-empty-hint { font-size: 12px; color: rgba(255,255,255,0.2); }
.ds-empty-btn { font-size: 12px; color: #ec3586; background: none; border: none; cursor: pointer; padding: 0; margin-top: 4px; }
.ds-primary-btn { display: inline-block; background: #ec3586; color: white; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 18px; border-radius: 8px; }

/* ── History view ─────────────────────────────────────── */
.ds-history-toolbar { display: flex; align-items: center; gap: 12px; }
.ds-history-search { background: #0f0f14; border: 1px solid #1e1e28; border-radius: 8px; padding: 7px 14px; color: #e8e8f0; font-size: 13px; width: 260px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-history-search::placeholder { color: #6b7280; }
.ds-history-search:focus { border-color: rgba(236,53,134,0.4); }
.ds-filter-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 3px; border-radius: 8px; }
.ds-filter-tab { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.1s; }
.ds-filter-active { background: #ec3586; color: white; }
.ds-history-count { font-size: 12px; color: #6b7280; margin-left: auto; }

.ds-history-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 18px; border-bottom: 1px solid #1e1e28;
  background: none; width: 100%; text-align: left; cursor: pointer;
  transition: background 0.1s; text-decoration: none; color: inherit;
}
.ds-history-row:last-child { border-bottom: none; }
.ds-history-row:hover { background: rgba(255,255,255,0.025); }
.ds-comparison-row { padding: 13px 18px; }

.ds-history-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-pending { background: rgba(255,255,255,0.15); }
.dot-running { background: #ec3586; }
.dot-done    { background: #00d4aa; }
.dot-error   { background: #ff4757; }

.ds-history-pillars { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
.ds-mini-bar-wrap { width: 3px; height: 28px; background: #1e1e28; border-radius: 2px; display: flex; flex-direction: column; justify-content: flex-end; }
.ds-mini-bar { width: 100%; border-radius: 2px; transition: height 0.3s; }
.ds-history-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; flex-shrink: 0; width: 40px; text-align: right; }
.ds-history-actions { display: flex; gap: 2px; align-items: center; flex-shrink: 0; }
.ds-icon-btn { width: 28px; height: 28px; border-radius: 6px; background: transparent; border: none; color: rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
.ds-icon-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
.ds-icon-btn--active { color: #ec3586; }
.ds-icon-btn--danger:hover { background: rgba(255,71,87,0.12); color: #ff4757; }

/* ── Compare view ─────────────────────────────────────── */
.ds-compare-form { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.ds-compare-col { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
.ds-compare-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Space Grotesk', sans-serif; }
.ds-compare-input { background: #16161e; border: 1px solid #1e1e28; border-radius: 8px; padding: 9px 14px; color: #e8e8f0; font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; width: 100%; }
.ds-compare-input::placeholder { color: #6b7280; }
.ds-compare-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-compare-vs { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #6b7280; padding-bottom: 10px; }
.ds-compare-btn { background: #ec3586; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
.ds-compare-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Bulk view ────────────────────────────────────────── */
.ds-bulk-progress { flex: 1; max-width: 120px; height: 4px; background: #1e1e28; border-radius: 2px; overflow: hidden; }
.ds-bulk-bar { height: 100%; background: #ec3586; border-radius: 2px; transition: width 0.3s; }

/* ── Result view ──────────────────────────────────────── */
.ds-result-layout { display: flex; flex-direction: column; gap: 18px; }
.ds-result-hero { display: flex; align-items: flex-start; gap: 28px; }
.ds-result-ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.ds-result-ring-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ds-result-big-score { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; line-height: 1; }
.ds-result-score-label { font-size: 11px; color: #6b7280; }
.ds-result-meta { flex: 1; min-width: 0; }
.ds-result-url { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: #e8e8f0; word-break: break-all; margin-bottom: 4px; }
.ds-result-time { font-size: 12px; color: #6b7280; margin-bottom: 10px; }
.ds-result-status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.ds-monitored-tag { font-size: 11px; color: #00d4aa; }
.ds-result-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ds-action-btn { padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #1e1e28; background: transparent; color: #9898b0; transition: all 0.1s; text-decoration: none; display: inline-block; font-family: 'DM Sans', sans-serif; }
.ds-action-btn:hover { border-color: rgba(255,255,255,0.15); color: #e8e8f0; }
.ds-action-btn--active { color: #ec3586; border-color: rgba(236,53,134,0.3); }
.ds-action-btn--danger:hover { color: #ff4757; border-color: rgba(255,71,87,0.3); }
.ds-action-btn--primary { background: #ec3586; color: white !important; border-color: #ec3586 !important; }
.ds-action-btn--primary:hover { opacity: 0.9; }

.rs-pillars-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.rs-pillar-card {
  position: relative; background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 16px 16px 14px; overflow: hidden;
  display: flex; flex-direction: column; gap: 10px;
}
.rs-pillar-card-top {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--pc, #fff) 50%, transparent);
  opacity: 0.6;
}
.rs-pillar-card-glow {
  position: absolute; inset: 0; pointer-events: none; border-radius: 12px;
  background: radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--pc, #fff) 8%, transparent) 0%, transparent 65%);
}
.rs-pillar-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: color-mix(in srgb, var(--pc, #fff) 80%, white);
  display: flex; align-items: center; gap: 6px;
}
.rs-pillar-bonus {
  font-size: 8px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 1px 5px;
  letter-spacing: 0.1em;
}
.rs-pillar-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 800;
  line-height: 1; letter-spacing: -0.04em;
}
.rs-pillar-bar-bg { height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; width: 100%; }
.rs-pillar-bar    { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); min-width: 2px; }

/* ── Tools dropdown (sidebar) ─────────────────────────── */
.ds-nav-chevron { width: 12px; height: 12px; margin-left: auto; transition: transform 0.2s; opacity: 0.5; flex-shrink: 0; }
.ds-nav-chevron--open { transform: rotate(180deg); }
.ds-tools-dropdown { padding: 2px 0 6px 28px; display: flex; flex-direction: column; gap: 1px; }
.ds-tools-sub-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px 5px 0; color: #6b7280; font-size: 12px;
  text-decoration: none; background: none; border: none;
  width: 100%; text-align: left; cursor: pointer;
  transition: color 0.1s; border-radius: 5px;
}
.ds-tools-sub-item:hover { color: #e8e8f0; }
.ds-tools-sub-active { color: white !important; background: color-mix(in srgb, var(--ac) 10%, transparent) !important; }
.ds-tools-sub-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

/* ── Tool detail view ─────────────────────────────────── */
.ds-tool-detail { min-height: 100%; }
.ds-tool-loading { display: flex; align-items: center; gap: 12px; padding: 60px 0; justify-content: center; color: #6b7280; font-size: 13px; }
.ds-tool-loading-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec3586; animation: pulse 1s infinite; }

/* ── Scan view ────────────────────────────────────────── */
.ds-scan-hero { background: linear-gradient(135deg, rgba(236,53,134,0.06) 0%, rgba(108,92,231,0.06) 100%); border: 1px solid rgba(236,53,134,0.15); border-radius: 14px; padding: 40px 24px; display: flex; justify-content: center; }
.ds-scan-hero-inner { max-width: 560px; width: 100%; text-align: center; }
.ds-scan-hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #e8e8f0; margin-bottom: 8px; }
.ds-scan-hero-sub { font-size: 13px; color: #6b7280; margin-bottom: 22px; line-height: 1.5; }
.ds-scan-hero-form { display: flex; gap: 8px; }
.ds-scan-hero-input { flex: 1; background: #0f0f14; border: 1px solid #1e1e28; border-radius: 10px; padding: 11px 16px; color: #e8e8f0; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-scan-hero-input::placeholder { color: #6b7280; }
.ds-scan-hero-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-scan-hero-btn { background: #ec3586; color: white; border: none; border-radius: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', sans-serif; white-space: nowrap; transition: opacity 0.15s; }
.ds-scan-hero-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ds-scan-hero-btn:hover:not(:disabled) { opacity: 0.88; }
.ds-pillar-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 16px; }
.ds-pillar-chip { font-size: 10px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 20px; border: 1px solid; background: transparent; text-transform: uppercase; }
.ds-scan-recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.ds-scan-recent-card { background: #16161e; border: 1px solid #1e1e28; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; text-align: center; transition: border-color 0.15s, background 0.15s; }
.ds-scan-recent-card:hover { background: #1e1e28; border-color: rgba(255,255,255,0.1); }
.ds-scan-recent-fav { width: 36px; height: 36px; background: #0f0f14; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #9898b0; overflow: hidden; }
.ds-scan-recent-fav img { width: 20px; height: 20px; border-radius: 4px; }
.ds-scan-recent-domain { font-size: 12px; font-weight: 500; color: #e8e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
.ds-scan-recent-score { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; }
.ds-scan-recent-time { font-size: 10px; color: #6b7280; }

/* ── Charts view ──────────────────────────────────────── */
.ds-bar-chart { padding-top: 8px; }
.ds-bar-chart-inner { display: flex; align-items: flex-end; gap: 4px; height: 120px; }
.ds-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; }
.ds-bar-value { font-size: 9px; color: #6b7280; height: 14px; display: flex; align-items: center; font-family: 'Space Grotesk', sans-serif; }
.ds-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.ds-bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; }
.ds-bar-label { font-size: 9px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: clip; max-width: 100%; text-align: center; }

.ds-dist-chart { display: flex; flex-direction: column; gap: 14px; padding-top: 6px; }
.ds-dist-row { display: flex; align-items: center; gap: 10px; }
.ds-dist-label { font-size: 12px; color: #9898b0; width: 120px; flex-shrink: 0; }
.ds-dist-bar-bg { flex: 1; height: 8px; background: #1e1e28; border-radius: 4px; overflow: hidden; }
.ds-dist-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 2px; }
.ds-dist-count { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; width: 24px; text-align: right; flex-shrink: 0; }
.ds-dist-pct { font-size: 11px; color: #6b7280; width: 32px; text-align: right; flex-shrink: 0; }

.ds-top-site-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #1e1e28; background: none; width: 100%; text-align: left; cursor: pointer; transition: opacity 0.15s; }
.ds-top-site-row:last-child { border-bottom: none; }
.ds-top-site-row:hover { opacity: 0.75; }
.ds-top-site-score { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; flex-shrink: 0; width: 32px; text-align: right; }
.ds-top-site-sparkline { flex-shrink: 0; opacity: 0.7; }

/* ── Tools view (mirrors /tools page) ────────────────── */
.tl-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.05); scrollbar-width: none; flex-shrink: 0; }
.tl-tabs::-webkit-scrollbar { display: none; }
.tl-tab { display: inline-flex; align-items: center; gap: 7px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; padding: 12px 14px; color: rgba(255,255,255,0.28); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
.tl-tab:hover { color: rgba(255,255,255,0.6); }
.tl-tab--active { color: var(--tc); border-bottom-color: var(--tc); }
.tl-tdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.tl-tcount { font-family: 'Space Grotesk', sans-serif; font-size: 9px; background: rgba(255,255,255,0.06); border-radius: 4px; padding: 1px 5px; color: rgba(255,255,255,0.22); }
.tl-tab--active .tl-tcount { background: color-mix(in srgb, var(--tc) 15%, transparent); color: var(--tc); }

.tl-feat { position: relative; overflow: hidden; display: flex; align-items: stretch; border-radius: 14px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.07); text-decoration: none; min-height: 200px; transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s; }
.tl-feat:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px var(--pc); }
.tl-feat-shimmer { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--pc), transparent); opacity: 0; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-shimmer { opacity: 1; }
.tl-feat-glow { position: absolute; inset: 0; pointer-events: none; }
.tl-feat-deco { position: absolute; right: -20px; bottom: -20px; opacity: 0.045; pointer-events: none; transition: opacity 0.3s; }
.tl-feat:hover .tl-feat-deco { opacity: 0.07; }
.tl-feat-body { position: relative; z-index: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
.tl-feat-top { display: flex; align-items: center; gap: 12px; }
.tl-feat-ring { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid; }
.tl-feat-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.tl-fbadge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
.tl-fbadge--free { color: #00d4aa; background: rgba(0,212,170,0.08); border-color: rgba(0,212,170,0.22); }
.tl-fbadge--feat { color: #ec3586; background: rgba(236,53,134,0.08); border-color: rgba(236,53,134,0.22); }
.tl-feat-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem, 2.5vw, 1.9rem); font-weight: 800; color: white; letter-spacing: -0.03em; margin: 0; line-height: 1.1; }
.tl-feat-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.36); line-height: 1.6; margin: 0; flex: 1; }
.tl-feat-foot { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.tl-feat-checks { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; flex: 1; }
.tl-feat-cta { display: inline-flex; align-items: center; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 9px 18px; border-radius: 6px; transition: filter 0.15s, transform 0.15s; flex-shrink: 0; }
.tl-feat:hover .tl-feat-cta { filter: brightness(1.1); transform: translateX(2px); }

.tl-rest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.tl-rcard { display: flex; position: relative; overflow: hidden; border-radius: 12px; background: #0e0e13; border: 1px solid rgba(255,255,255,0.055); text-decoration: none; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; animation: tl-card-in 0.3s ease both; animation-delay: calc(var(--i) * 40ms); }
@keyframes tl-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.tl-rcard:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px var(--pc); }
.tl-rcard-accent { width: 3px; flex-shrink: 0; opacity: 0.5; transition: opacity 0.2s; }
.tl-rcard:hover .tl-rcard-accent { opacity: 1; }
.tl-rcard-inner { display: flex; flex-direction: column; gap: 9px; padding: 18px 18px 18px 16px; flex: 1; }
.tl-rcard-head { display: flex; align-items: center; gap: 8px; }
.tl-rcard-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tl-rcard-pillar { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; flex: 1; }
.tl-rcard-free { font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 2px 5px; }
.tl-rcard-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0; line-height: 1.3; transition: color 0.15s; }
.tl-rcard:hover .tl-rcard-title { color: white; }
.tl-rcard-desc { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.26); line-height: 1.5; margin: 0; flex: 1; }
.tl-rcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.tl-rcard-checks { font-family: 'Space Grotesk', sans-serif; font-size: 10px; padding: 2px 7px; border-radius: 4px; }
.tl-rcard-cta { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; color: var(--pc); letter-spacing: 0.04em; transition: letter-spacing 0.15s; }
.tl-rcard:hover .tl-rcard-cta { letter-spacing: 0.08em; }

.tl-fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.tl-fade-leave-active { transition: opacity 0.15s; }
.tl-fade-enter-from { opacity: 0; transform: translateY(6px); }
.tl-fade-leave-to   { opacity: 0; }

/* ── Result: scanning state ──────────────────────────── */
.rs-scanning {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 10px;
}
.rs-scan-rings { position: relative; width: 100px; height: 100px; margin-bottom: 24px; }
.rs-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05); }
.rs-ring-1 { inset: 0; }
.rs-ring-2 { inset: 14px; border-color: rgba(255,255,255,0.07); }
.rs-ring-3 { inset: 28px; border-color: rgba(255,255,255,0.09); }
.rs-ring-spin { inset: 0; border: 2px solid transparent; border-top-color: #ec3586; border-radius: 50%; animation: rs-spin 1.4s linear infinite; }
@keyframes rs-spin { to { transform: rotate(360deg); } }
.rs-ring-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; border-radius: 50%; background: #ec3586; animation: rs-pulse 1.4s ease-in-out infinite; }
@keyframes rs-pulse { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.4;transform:translate(-50%,-50%) scale(0.8)} }
.rs-scan-label { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
.rs-scan-url   { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); }
.rs-scan-sub   { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); max-width: 360px; text-align: center; }
.rs-scan-dots  { display: flex; gap: 5px; margin-top: 8px; }
.rs-scan-dot   { width: 5px; height: 5px; border-radius: 50%; background: rgba(236,53,134,0.5); animation: rs-pulse 1.4s ease-in-out infinite; }

/* ── Result: error state ─────────────────────────────── */
.rs-error { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 10px; }
.rs-error-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.15); display: flex; align-items: center; justify-content: center; color: #ff4757; margin-bottom: 6px; }
.rs-error-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.88); }
.rs-error-msg { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); max-width: 300px; text-align: center; }
.rs-retry-btn { margin-top: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; padding: 8px 16px; cursor: pointer; transition: background 0.15s; }
.rs-retry-btn:hover { background: rgba(255,255,255,0.1); }

/* ── Result: issues section ──────────────────────────── */
.rs-issue-total { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 400; margin-left: 6px; font-family: 'DM Sans', sans-serif; }
.rs-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 14px; }
.rs-tab {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
  background: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.12s;
  display: flex; align-items: center; gap: 5px;
}
.rs-tab:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }
.rs-tab--active { background: rgba(236,53,134,0.12); border-color: rgba(236,53,134,0.3); color: #ec3586; }
.rs-tab-count { font-size: 10px; background: rgba(255,255,255,0.07); border-radius: 4px; padding: 1px 5px; }
.rs-tab--active .rs-tab-count { background: rgba(236,53,134,0.15); }

.rs-issues { display: flex; flex-direction: column; }
.rs-issue { border-bottom: 1px solid rgba(255,255,255,0.04); }
.rs-issue:last-child { border-bottom: none; }
.rs-issue-head {
  display: flex; align-items: center; gap: 10px; padding: 11px 0;
  background: none; border: none; width: 100%; text-align: left; cursor: pointer;
  transition: opacity 0.1s;
}
.rs-issue-head:hover { opacity: 0.8; }
.rs-sev {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px;
  flex-shrink: 0; border: 1px solid;
}
.rs-sev--critical { color: #ff4757; background: rgba(255,71,87,0.1);   border-color: rgba(255,71,87,0.25); }
.rs-sev--warning  { color: #ffaa00; background: rgba(255,170,0,0.1);  border-color: rgba(255,170,0,0.25); }
.rs-sev--pass     { color: #00d4aa; background: rgba(0,212,170,0.1);  border-color: rgba(0,212,170,0.25); }
.rs-sev--info     { color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
.rs-issue-title { flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75); text-align: left; }
.rs-issue-pillar { font-family: 'DM Sans', sans-serif; font-size: 11px; flex-shrink: 0; }
.rs-fix-badge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; color: #00d4aa; background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.2); border-radius: 4px; padding: 2px 6px; flex-shrink: 0; }
.rs-issue-chevron { flex-shrink: 0; color: rgba(255,255,255,0.25); transition: transform 0.2s; }
.rs-issue-chevron.open { transform: rotate(180deg); color: rgba(255,255,255,0.5); }

.rs-issue-body { padding: 0 0 14px 0; display: flex; flex-direction: column; gap: 10px; }
.rs-issue-desc { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.65; margin: 0; }
.rs-snippet { background: #0a0a10; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; }
.rs-pre { font-family: 'Fira Mono','Cascadia Code',monospace; font-size: 11px; line-height: 1.65; color: rgba(255,255,255,0.65); padding: 12px 14px; margin: 0; overflow-x: auto; white-space: pre; }
.rs-tool-link {
  align-self: flex-start; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: #ec3586; background: rgba(236,53,134,0.08); border: 1px solid rgba(236,53,134,0.2);
  border-radius: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.12s;
}
.rs-tool-link:hover { background: rgba(236,53,134,0.16); }

/* ── Chart detail view ───────────────────────────────── */
.cd-wrap { display: flex; flex-direction: column; gap: 20px; }

.cd-hero {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 18px 20px;
}
.cd-fav { width: 36px; height: 36px; border-radius: 8px; font-size: 16px; }
.cd-hero-meta { flex: 1; min-width: 0; }
.cd-hero-host { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.88); }
.cd-hero-url  { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
.cd-hero-stats { display: flex; gap: 20px; }
.cd-hero-stat { text-align: center; }
.cd-hero-stat-val   { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
.cd-hero-stat-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 3px; white-space: nowrap; }
.cd-view-result-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600;
  color: #ec3586; background: rgba(236,53,134,0.1); border: 1px solid rgba(236,53,134,0.25);
  border-radius: 7px; padding: 8px 14px; cursor: pointer; transition: background 0.15s;
  white-space: nowrap;
}
.cd-view-result-btn:hover { background: rgba(236,53,134,0.18); }

.cd-main-chart-card { }
.cd-main-chart-wrap { padding: 8px 4px 4px; }
.cd-main-svg { width: 100%; height: auto; display: block; min-height: 120px; }

.cd-pillars-section { display: flex; flex-direction: column; gap: 12px; }
.cd-pillars-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.cd-pillar-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.cd-pillar-card-head { display: flex; align-items: center; gap: 8px; }
.cd-pillar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.cd-pillar-name { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.65); flex: 1; }
.cd-pillar-score { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; line-height: 1; }
.cd-pillar-single { display: flex; flex-direction: column; gap: 6px; }
.cd-pillar-bar-bg { height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
.cd-pillar-bar { height: 100%; border-radius: 3px; transition: width 0.4s; }
.cd-pillar-bar-val { font-family: 'DM Sans', sans-serif; font-size: 11px; }
.cd-pillar-card-foot { display: flex; justify-content: space-between; align-items: center; }
.cd-pillar-scan-count { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.28); }
.cd-pillar-delta { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; }

.cd-log-card { }
.cd-log-wrap { overflow-x: auto; }
.cd-log-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; font-size: 12px; }
.cd-log-table thead th {
  text-align: left; padding: 8px 12px;
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.25);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.cd-log-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.1s; }
.cd-log-table tbody tr:hover { background: rgba(255,255,255,0.025); }
.cd-log-table tbody td { padding: 9px 12px; vertical-align: middle; }
.cd-log-date { color: rgba(255,255,255,0.45); white-space: nowrap; }
.cd-log-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
  padding: 3px 8px; border-radius: 5px; border: 1px solid;
}
.cd-log-pill { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; }
.cd-log-na { color: rgba(255,255,255,0.2); }
.cd-log-view {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.45); background: none; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px; padding: 4px 9px; cursor: pointer; transition: color 0.1s, border-color 0.1s;
}
.cd-log-view:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.25); }

/* ── Per-site score history charts ───────────────────── */
.cht-section { display: flex; flex-direction: column; gap: 16px; }
.cht-section-head { display: flex; align-items: baseline; gap: 10px; }
.cht-section-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,0.75);
}
.cht-section-sub {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.28);
}
.cht-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;
}
.cht-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;
  padding: 16px; display: flex; flex-direction: column; gap: 14px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.cht-card:hover { border-color: rgba(255,255,255,0.14); background: #13131a; }

.cht-card-head { display: flex; align-items: center; gap: 10px; }
.cht-card-meta { flex: 1; min-width: 0; }
.cht-card-host {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.82); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cht-card-count { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px; }
.cht-card-score {
  font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800;
  line-height: 1; flex-shrink: 0;
}

.cht-chart-wrap { border-radius: 8px; overflow: hidden; background: #0a0a10; }
.cht-svg { width: 100%; height: 90px; display: block; }

.cht-pillars { display: flex; flex-direction: column; gap: 6px; }
.cht-pillar { display: flex; align-items: center; gap: 8px; }
.cht-p-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.35); width: 28px; flex-shrink: 0;
}
.cht-p-bar-bg {
  flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden;
}
.cht-p-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.cht-p-val {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  width: 22px; text-align: right; flex-shrink: 0;
}
</style>
