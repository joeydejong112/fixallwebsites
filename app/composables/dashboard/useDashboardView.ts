import type { Ref, ComputedRef } from 'vue'
import type { DashboardTool } from '~/lib/dashboard/tools'
import { allTools } from '~/lib/dashboard/tools'
import { useScoreFormat } from '~/composables/dashboard/useScoreFormat'

export type View = 'overview' | 'scan' | 'history' | 'compare' | 'bulk' | 'charts' | 'chart-detail' | 'tools' | 'tool-detail' | 'result'

export function useDashboardView(opts: {
  scans: Ref<any[]>
  doneScans: ComputedRef<any[]>
}) {
  const currentView  = ref<View>('overview')
  const selectedScan = ref<any>(null)
  const toolsExpanded = ref(false)
  const selectedTool  = ref<string | null>(null)
  const selectedChartUrl = ref<string | null>(null)

  function setView(v: View) {
    currentView.value = v
    if (v !== 'result') {
      selectedScan.value = null
    }
  }

  function openScan(scan: any) {
    selectedScan.value = scan
    currentView.value = 'result'
  }

  function openScanByUrl(url: string) {
    const s = opts.scans.value.filter(x => x.url === url && x.status === 'done').sort((a, b) => b._creationTime - a._creationTime)[0]
    if (s) openScan(s)
  }

  function openChartDetail(url: string) {
    selectedChartUrl.value = url
    currentView.value = 'chart-detail'
  }

  function openTool(slug: string) {
    selectedTool.value = slug
    toolsExpanded.value = true
    currentView.value = 'tool-detail'
  }

  function dashboardNavigate(href: string) {
    if (href === '/' || href === '/scan') { setView('scan'); return }
    const slug = href.split('/').pop()
    if (slug) openTool(slug)
  }

  const route = useRoute()
  const applyQueryView = () => {
    const q = route.query.view
    if (typeof q === 'string' && (['overview', 'scan', 'history', 'compare', 'bulk', 'charts', 'chart-detail', 'tools', 'tool-detail', 'result'] as const).includes(q as View)) {
      setView(q as View)
    }
  }
  onMounted(applyQueryView)
  watch(() => route.query.view, applyQueryView)

  const currentToolMeta = computed(() => allTools.find(t => t.slug === selectedTool.value) ?? null)

  const { hostname, relativeTime } = useScoreFormat()
  const topbarInfo = computed(() => ({
    overview:     { title: 'Command Center',  sub: 'Overview of all your scans' },
    history:      { title: 'Scan History',    sub: `${opts.scans.value.length} scans` },
    compare:      { title: 'Compare',         sub: 'Side-by-side competitor analysis' },
    bulk:         { title: 'Bulk Scan',       sub: 'Scan multiple URLs at once' },
    scan:         { title: 'New Scan',        sub: 'Analyze a website across 7 pillars' },
    charts:       { title: 'Charts',          sub: `Analytics for ${opts.doneScans.value.length} completed scans` },
    tools:        { title: 'Tools',           sub: '10 free web audit tools' },
    'tool-detail':  { title: currentToolMeta.value?.title ?? 'Tool', sub: currentToolMeta.value?.pillar ?? '' },
    'chart-detail': { title: selectedChartUrl.value ? hostname(selectedChartUrl.value) : 'Site Charts', sub: 'Score history & pillar breakdown' },
    result:         { title: selectedScan.value ? hostname(selectedScan.value.url) : 'Result', sub: selectedScan.value?.status === 'pending' || selectedScan.value?.status === 'running' ? 'Scanning…' : selectedScan.value ? `Scanned ${relativeTime(selectedScan.value._creationTime)}` : '' },
  })[currentView.value])

  return {
    currentView,
    selectedScan,
    selectedTool,
    selectedChartUrl,
    toolsExpanded,
    setView,
    openScan,
    openScanByUrl,
    openChartDetail,
    openTool,
    dashboardNavigate,
    currentToolMeta,
    topbarInfo,
  }
}
