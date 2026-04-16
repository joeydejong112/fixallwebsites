import type { Id } from '~~/convex/_generated/dataModel'
import type { DashboardData } from '~/pages/dashboard/index.vue'

export interface ScanActionsOptions {
  onScanCreated?: (scanId: Id<'scans'>) => void
}

export function useScanActions(
  data: Pick<DashboardData, 'scans' | 'monitors'>,
  opts?: ScanActionsOptions,
) {
  const scanning = ref(false)
  let resultPollInterval: ReturnType<typeof setInterval> | null = null

  const client = useConvex()

  async function handleScan(url: string) {
    const userId = useUserId()
    if (!userId.value) return
    scanning.value = true
    try {
      const newScanId = await client.mutation(api.scans.createScan, { userId: userId.value, url })
      client.action(api.scanAction.runScan, { scanId: newScanId, url }).catch(() => {})
      opts?.onScanCreated?.(newScanId)
      scanning.value = false

      if (resultPollInterval) clearInterval(resultPollInterval)
      resultPollInterval = setInterval(async () => {
        const updated = await client.query(api.scans.getScan, { scanId: newScanId })
        if (updated) {
          const idx = data.scans.value.findIndex((s: any) => s._id === newScanId)
          if (idx >= 0) data.scans.value[idx] = updated
          else data.scans.value = [updated, ...data.scans.value]
        }
        if (updated?.status === 'done' || updated?.status === 'error') {
          clearInterval(resultPollInterval!); resultPollInterval = null
        }
      }, 2000)
    } catch (e) {
      scanning.value = false
      const toast = useAppToast()
      toast.error(e instanceof Error ? e.message : 'Scan failed')
    }
  }

  async function deleteScan(scanId: Id<'scans'>, e?: Event) {
    const userId = useUserId()
    e?.preventDefault()
    const confirm = useConfirm()
    const ok = await confirm({ message: 'This scan will be permanently removed from your history.', confirmLabel: 'Delete', cancelLabel: 'Keep' })
    if (!ok) return
    await client.mutation(api.scans.deleteScan, { scanId, userId: userId.value! })
    data.scans.value = data.scans.value.filter(s => s._id !== scanId)
  }

  async function reScan(url: string, e?: Event) {
    e?.preventDefault()
    await handleScan(url)
  }

  async function toggleMonitor(url: string, e?: Event) {
    const userId = useUserId()
    const convexUser = inject('convexUser') as Ref<{ plan: 'free' | 'pro'; scanCount: number } | null> | undefined
    e?.preventDefault()
    const toast = useAppToast()
    if (convexUser?.value?.plan !== 'pro') {
      toast.warning('Monitoring is a Pro feature. Upgrade to watch your sites automatically.')
      return
    }
    const existing = data.monitors.value.find(m => m.url === url)
    const confirm = useConfirm()
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
    return data.monitors.value.some(m => m.url === url && m.isActive)
  }

  onUnmounted(() => {
    if (resultPollInterval) clearInterval(resultPollInterval)
  })

  return {
    scanning: readonly(scanning),
    handleScan,
    deleteScan,
    reScan,
    toggleMonitor,
    isMonitored,
  }
}