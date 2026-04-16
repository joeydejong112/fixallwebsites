<script setup lang="ts">
import { useRouter } from 'vue-router'
import { data } from '~/composables/dashboard/useDashboardData'

const router = useRouter()

const hostname = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

const compareUrlA = ref('')
const compareUrlB = ref('')

const submitCompare = () => {
  if (!compareUrlA.value.trim() || !compareUrlB.value.trim()) return
  router.push(`/compare?urlA=${encodeURIComponent(compareUrlA.value.trim())}&urlB=${encodeURIComponent(compareUrlB.value.trim())}`)
}

defineProps({})
defineEmits([])
</script>

<template>
  <div>
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
      <div v-if="!data.recentComparisons.value.length" class="ds-empty-state">
        <p>No comparisons yet</p>
        <p class="ds-empty-hint">Enter two URLs above to compare sites side by side.</p>
      </div>
      <NuxtLink v-else v-for="c in data.recentComparisons.value" :key="`${c.scanIdA}-${c.scanIdB}`" :to="`/compare/${c.scanIdA}/${c.scanIdB}`" class="ds-history-row ds-comparison-row">
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
  </div>
</template>
