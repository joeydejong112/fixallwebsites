<script setup lang="ts">
const props = defineProps<{ cspValue: string }>()
const UNSAFE = ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:']

interface Token { text: string; type: 'sep' | 'directive' | 'safe' | 'unsafe' }

const tokens = computed<Token[]>(() => {
  if (!props.cspValue) return []
  const result: Token[] = []
  const parts = props.cspValue.split(';')
  parts.forEach((part, i) => {
    if (i > 0) result.push({ text: '; ', type: 'sep' })
    const tokens2 = part.trim().split(/\s+/)
    tokens2.forEach((t, j) => {
      if (j === 0) {
        result.push({ text: t, type: 'directive' })
      } else {
        result.push({ text: ' ' + t, type: UNSAFE.includes(t) ? 'unsafe' : 'safe' })
      }
    })
  })
  return result
})
</script>

<template>
  <span class="csp-value">
    <template v-for="(tok, i) in tokens" :key="i">
      <span v-if="tok.type === 'sep'" class="tok-sep">{{ tok.text }}</span>
      <span v-else-if="tok.type === 'directive'" class="tok-dir">{{ tok.text }}</span>
      <span v-else-if="tok.type === 'safe'" class="tok-safe">{{ tok.text }}</span>
      <span v-else class="tok-unsafe">{{ tok.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.csp-value { word-break: break-all; }
.tok-sep  { color: var(--text-muted); }
.tok-dir  { color: var(--p-security); }
.tok-safe { color: rgba(255,255,255,0.85); }
.tok-unsafe { color: var(--p-performance); }
</style>