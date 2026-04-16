// Chart geometry helpers for SVG score charts (dashboard + history pages)

export const CD_W = 560, CD_H = 150, CD_PL = 34, CD_PR = 14, CD_PT = 14, CD_PB = 30
// computed: CD_CW = CD_W - CD_PL - CD_PR, CD_CH = CD_H - CD_PT - CD_PB
export const CD_GRID = [0, 25, 50, 75, 100]

export function chartSvgPoints(scores: number[]): string {
  if (scores.length === 1) return `150,${62 - scores[0] / 100 * 52}`
  return scores.map((s, i) => `${12 + i / (scores.length - 1) * 276},${62 - s / 100 * 52}`).join(' ')
}

export function chartAreaPath(scores: number[]): string {
  if (scores.length < 2) return ''
  const pts = scores.map((s, i) => `${12 + i / (scores.length - 1) * 276},${62 - s / 100 * 52}`)
  const lastX = 12 + 276
  return `M ${pts.join(' L ')} L ${lastX},70 L 12,70 Z`
}

export function chartDotX(i: number, total: number): number {
  return total === 1 ? 150 : 12 + i / (total - 1) * 276
}

export function chartDotY(score: number): number {
  return 62 - score / 100 * 52
}

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function cdX(i: number, n: number): number {
  const CD_CW = CD_W - CD_PL - CD_PR
  return n <= 1 ? CD_PL + CD_CW / 2 : CD_PL + (i / (n - 1)) * CD_CW
}

export function cdY(score: number): number {
  const CD_CH = CD_H - CD_PT - CD_PB
  return CD_PT + (1 - score / 100) * CD_CH
}

export function cdPolyline(scores: number[]): string {
  return scores.map((s, i) => `${cdX(i, scores.length)},${cdY(s)}`).join(' ')
}

export function cdAreaPath(scores: number[]): string {
  if (scores.length < 2) return ''
  const CD_CH = CD_H - CD_PT - CD_PB
  const pts = scores.map((s, i) => `${cdX(i, scores.length)},${cdY(s)}`).join(' L ')
  return `M ${pts} L ${cdX(scores.length - 1, scores.length)},${CD_PT + CD_CH} L ${CD_PL},${CD_PT + CD_CH} Z`
}

export function useChartGeometry() {
  return {
    chartSvgPoints,
    chartAreaPath,
    chartDotX,
    chartDotY,
    shortDate,
    cdX,
    cdY,
    cdPolyline,
    cdAreaPath,
  }
}
