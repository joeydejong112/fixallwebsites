import { ref } from 'vue'
import { useConvex, useConvexWs } from '~/composables/useConvex'

export interface DashboardData {
  scans: import('vue').Ref<any[]>
  monitors: import('vue').Ref<any[]>
  bulkScans: import('vue').Ref<any[]>
  convexUser: import('vue').Ref<{ plan: 'free' | 'pro'; scanCount: number } | null>
  urlSparklines: import('vue').Ref<Map<string, number[]>>
  recentComparisons: import('vue').Ref<{ urlA: string; urlB: string; scanIdA: string; scanIdB: string }[]>
  loading: import('vue').Ref<boolean>
  loadUserData: (id: string) => Promise<void>
  pushRecentComparison: (entry: { urlA: string; urlB: string; scanIdA: string; scanIdB: string }) => void
}

export function useDashboardData(): DashboardData {
  const { client, api } = useConvex()
  const { client: wsClient } = useConvexWs()

  const scans             = ref<any[]>([])
  const monitors          = ref<any[]>([])
  const bulkScans         = ref<any[]>([])
  const convexUser        = ref<{ plan: 'free' | 'pro'; scanCount: number } | null>(null)
  const urlSparklines     = ref<Map<string, number[]>>(new Map())
  const recentComparisons = ref<{ urlA: string; urlB: string; scanIdA: string; scanIdB: string }[]>([])
  const loading           = ref(true)

  let unsubscribeScans: (() => void) | null = null
  let unsubscribeMonitors: (() => void) | null = null

  onMounted(() => {
    try {
      const raw = localStorage.getItem('sp_recent_comparisons')
      if (raw) recentComparisons.value = JSON.parse(raw)
    } catch {}
  })

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
      monitors.value    = userMonitors.status === 'fulfilled' ? userMonitors.value : []
      bulkScans.value   = userBulkScans.status === 'fulfilled' ? userBulkScans.value : []

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
        unsubscribeScans    = wsClient.onUpdate(api.scans.getScansByUser, { userId: id }, (u) => { scans.value = u })
        unsubscribeMonitors = wsClient.onUpdate(api.monitors.getMonitors, { userId: id }, (u) => { monitors.value = u })
      }
    } finally {
      loading.value = false
    }
  }

  function pushRecentComparison(entry: { urlA: string; urlB: string; scanIdA: string; scanIdB: string }) {
    const existing = recentComparisons.value.findIndex(e => e.scanIdA === entry.scanIdA && e.scanIdB === entry.scanIdB)
    if (existing !== -1) {
      recentComparisons.value.splice(existing, 1)
    }
    recentComparisons.value.unshift(entry)
    if (recentComparisons.value.length > 10) {
      recentComparisons.value = recentComparisons.value.slice(0, 10)
    }
    try {
      localStorage.setItem('sp_recent_comparisons', JSON.stringify(recentComparisons.value))
    } catch {}
  }

  onUnmounted(() => {
    if (unsubscribeScans) unsubscribeScans()
    if (unsubscribeMonitors) unsubscribeMonitors()
  })

  return {
    scans,
    monitors,
    bulkScans,
    convexUser,
    urlSparklines,
    recentComparisons,
    loading,
    loadUserData,
    pushRecentComparison,
  }
}