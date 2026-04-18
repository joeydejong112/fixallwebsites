// app/composables/dashboard/useScoreHistory.ts
// Fetches score history for the trend chart — 12 weeks by default.

import { ref } from 'vue'
import { useConvex } from './useConvex'

export interface ScoreHistoryPoint {
  x: number
  score: number
}

export function useScoreHistory(url: Ref<string | null>, weeks = 12) {
  const history = ref<ScoreHistoryPoint[]>([])

  async function load() {
    if (!url.value) {
      history.value = []
      return
    }
    const { client, api } = useConvex()
    try {
      const rows = await client.query(api.scoreHistory.getRecentHistory, {
        url: url.value,
        limit: weeks,
      })
      if (rows && rows.length > 0) {
        history.value = [...rows]
          .reverse()
          .map((h: any, i: number) => ({ x: i, score: h.overallScore }))
      } else {
        history.value = []
      }
    } catch {
      history.value = []
    }
  }

  watch(url, () => load(), { immediate: true })

  return { history, load }
}
