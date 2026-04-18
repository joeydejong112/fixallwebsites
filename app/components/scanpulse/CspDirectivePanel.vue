<script setup lang="ts">
interface Directive {
  name: string
  description: string
  sources: string[]
  newSource: string
  _animKey?: number
}

const props = defineProps<{
  directives: Directive[]
}>()

const emit = defineEmits<{
  'add-source': [dir: Directive]
  'remove-source': [dir: Directive, src: string]
}>()

const UNSAFE = ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:']

function isUnsafe(src: string) { return UNSAFE.includes(src) }

function addSource(dir: Directive) {
  const src = dir.newSource.trim()
  if (!src || dir.sources.includes(src)) return
  emit('add-source', dir)
}

function onKeydown(e: KeyboardEvent, dir: Directive) {
  if (e.key === 'Enter') addSource(dir)
}

// Track newly added source for animation
const animatingSrc = ref<string | null>(null)
const prevSourcesLen = ref(0)

watch(() => props.directives.map(d => d.sources.length), (lens) => {
  lens.forEach((len, i) => {
    if (len > prevSourcesLen[i]) {
      const dir = props.directives[i]
      animatingSrc.value = dir.sources[dir.sources.length - 1]
      setTimeout(() => animatingSrc.value = null, 500)
    }
    prevSourcesLen.value = [...lens]
  })
}, { immediate: true })
</script>

<template>
  <div class="directive-list">
    <div
      v-for="dir in props.directives"
      :key="dir.name"
      class="dir-card"
    >
      <div class="dir-header">
        <div class="dir-name-row">
          <code class="dir-name">{{ dir.name }}</code>
          <span v-if="dir.sources.some(s => UNSAFE.includes(s))" class="chip chip--warn">
            <span class="dot dot--warn" />
            Weakens protection
          </span>
        </div>
        <p class="dir-desc">{{ dir.description }}</p>
      </div>

      <!-- Source pills -->
      <div class="source-chips">
        <span
          v-for="src in dir.sources"
          :key="src"
          class="chip"
          :class="{ 'chip--bad': isUnsafe(src), 'chip--anim': src === animatingSrc }"
        >
          {{ src }}
          <button class="chip-remove" @click="emit('remove-source', dir, src)">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </span>
      </div>

      <!-- Add source row -->
      <div class="add-source-row">
        <input
          v-model="dir.newSource"
          class="add-input"
          type="text"
          :placeholder="`+ Add source (e.g. https://cdn.example.com)`"
          @keydown="onKeydown($event, dir)"
        />
        <button class="btn btn-ghost add-btn" @click="addSource(dir)">Add</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.directive-list { display: flex; flex-direction: column; gap: 14px; }

.dir-card {
  background: var(--elevated); border: 1px solid var(--border);
  border-radius: 10px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
}

.dir-header { display: flex; flex-direction: column; gap: 6px; }
.dir-name-row { display: flex; align-items: center; gap: 10px; }
.dir-name {
  font-family: var(--font-mono); font-size: 14px; font-weight: 600;
  color: var(--p-security);
}
.dir-desc { font-family: var(--font-body); font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5; }

/* ── Chips ─────────────────────────────────────────────────── */
.source-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 5px 5px 10px;
  border-radius: 6px;
  font-family: var(--font-mono); font-size: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  color: var(--text);
}
.chip--bad { color: var(--p-performance); background: rgba(255,170,0,0.1); border-color: rgba(255,170,0,0.3); }
.chip--anim { animation: pill-slide-in 0.4s cubic-bezier(.16,1,.3,1) both; }

@keyframes pill-slide-in {
  from { transform: translateX(-10px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--p-security); }
.dot--warn { background: var(--p-performance); }

.chip-remove {
  width: 18px; height: 18px;
  border: none; background: rgba(255,255,255,0.06);
  color: var(--text-muted); border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  padding: 0; transition: background 0.15s, color 0.15s;
}
.chip-remove:hover { background: rgba(255,255,255,0.14); color: var(--text); }

/* ── Add source ──────────────────────────────────────────────── */
.add-source-row { display: flex; gap: 6px; }
.add-input {
  flex: 1; padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.02); border: 1px solid var(--border);
  color: var(--text); font-family: var(--font-mono); font-size: 12px;
  outline: none; transition: border-color 0.15s;
}
.add-input:focus { border-color: rgba(0,212,170,0.35); }
.add-input::placeholder { color: var(--text-faint); }

.add-btn { height: 32px; padding: 0 12px; font-size: 12px; }

@media (prefers-reduced-motion: reduce) {
  .chip--anim { animation: none; }
  .chip-remove { transition: none; }
  .add-input { transition: none; }
}
</style>