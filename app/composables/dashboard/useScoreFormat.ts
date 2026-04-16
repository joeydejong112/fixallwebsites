import type { Ref } from 'vue'

export function useScoreFormat() {
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

  function faviconUrl(url: string) {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32` } catch { return null }
  }

  function hostname(url: string) {
    try { return new URL(url).hostname } catch { return url }
  }

  function trendColor(trend: string | null) {
    if (trend === '↑') return '#00d4aa'; if (trend === '↓') return '#ff4757'; return 'rgba(255,255,255,0.3)'
  }

  return { scoreColor, scoreBg, statusLabel, relativeTime, faviconUrl, hostname, trendColor }
}

export function useScoreTrend(scans: Ref<any[]>) {
  function scoreTrend(url: string): '↑' | '↓' | '→' | null {
    const urlScans = scans.value
      .filter(s => s.url === url && s.status === 'done' && s.overallScore != null)
      .sort((a, b) => b._creationTime - a._creationTime)
    if (urlScans.length < 2) return null
    const diff = urlScans[0].overallScore - urlScans[1].overallScore
    if (diff > 2) return '↑'; if (diff < -2) return '↓'; return '→'
  }

  return { scoreTrend }
}