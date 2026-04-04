<script setup lang="ts">

const open   = ref(false)
const query  = ref('')
const cursor = ref(0)
const input  = ref<HTMLInputElement | null>(null)
const router = useRouter()

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return TOOLS
  return TOOLS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.pillar.toLowerCase().includes(q) ||
    t.short.toLowerCase().includes(q)
  )
})

watch(query, () => { cursor.value = 0 })
watch(open, (v) => {
  if (v) nextTick(() => input.value?.focus())
  else { query.value = ''; cursor.value = 0 }
})

function openPalette() { open.value = true }

function close() { open.value = false }

function navigate(t: Tool) {
  router.push(`/tools/${t.slug}`)
  close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = (cursor.value + 1) % filtered.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = (cursor.value - 1 + filtered.value.length) % filtered.value.length
  } else if (e.key === 'Enter') {
    const t = filtered.value[cursor.value]
    if (t) navigate(t)
  } else if (e.key === 'Escape') {
    close()
  }
}

// Global Cmd+K / Ctrl+K listener
onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKey)
})
function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

// Group tools by pillar for "no query" state
const grouped = computed(() =>
  PILLARS.map(p => ({
    ...p,
    tools: TOOLS.filter(t => t.pillar === p.key)
  })).filter(g => g.tools.length)
)

defineExpose({ openPalette })
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="open" class="backdrop" @click.self="close">
        <div class="palette" @keydown="onKey">

          <!-- Search input -->
          <div class="palette-search">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref="input"
              v-model="query"
              class="search-input"
              placeholder="Search tools…"
              autocomplete="off"
              spellcheck="false"
            />
            <kbd class="search-esc" @click="close">esc</kbd>
          </div>

          <!-- Results -->
          <div class="palette-results">
            <!-- Filtered list -->
            <template v-if="query">
              <div v-if="!filtered.length" class="empty">No tools match "{{ query }}"</div>
              <button
                v-for="(t, i) in filtered" :key="t.slug"
                class="result-row"
                :class="{ 'result-row--active': i === cursor }"
                @mouseenter="cursor = i"
                @click="navigate(t)"
              >
                <div class="row-icon" :style="`color:${t.color};background:${t.color}15`">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"/>
                </div>
                <div class="row-text">
                  <span class="row-title">{{ t.title }}</span>
                  <span class="row-short">{{ t.short }}</span>
                </div>
                <span class="row-pillar" :style="`color:${t.color}`">{{ t.pillar }}</span>
                <svg class="row-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            </template>

            <!-- Grouped by pillar (no query) -->
            <template v-else>
              <div v-for="group in grouped" :key="group.key" class="group">
                <div class="group-label">
                  <span class="group-dot" :style="`background:${group.color}`"/>
                  {{ group.key }}
                </div>
                <button
                  v-for="(t, i) in group.tools" :key="t.slug"
                  class="result-row"
                  :class="{ 'result-row--active': filtered.indexOf(t) === cursor }"
                  @mouseenter="cursor = filtered.indexOf(t)"
                  @click="navigate(t)"
                >
                  <div class="row-icon" :style="`color:${t.color};background:${t.color}15`">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"/>
                  </div>
                  <div class="row-text">
                    <span class="row-title">{{ t.title }}</span>
                    <span class="row-short">{{ t.short }}</span>
                  </div>
                  <svg class="row-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="palette-foot">
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 12vh;
}

.palette {
  width: 100%; max-width: 560px;
  background: #13131a; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6);
}

/* Search row */
.palette-search {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.search-icon { color: rgba(255,255,255,0.25); flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  font-family: 'DM Sans', sans-serif; font-size: 15px; color: white;
}
.search-input::placeholder { color: rgba(255,255,255,0.2); }
.search-esc {
  font-family: 'Fira Mono', monospace; font-size: 10px;
  color: rgba(255,255,255,0.42); background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
  padding: 2px 6px; cursor: pointer; flex-shrink: 0;
}

/* Results */
.palette-results { max-height: 380px; overflow-y: auto; padding: 6px 0; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }

.group { padding: 0; }
.group-label {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(255,255,255,0.42); padding: 10px 16px 4px;
}
.group-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.result-row {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 16px;
  background: none; border: none; cursor: pointer;
  text-align: left; transition: background 0.1s;
}
.result-row--active { background: rgba(255,255,255,0.05); }

.row-icon {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.row-text { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.row-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.row-short {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.48); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.row-pillar {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; flex-shrink: 0;
}
.row-arrow { color: rgba(255,255,255,0.15); flex-shrink: 0; transition: color 0.1s; }
.result-row--active .row-arrow { color: rgba(255,255,255,0.5); }

.empty {
  padding: 32px 16px; text-align: center;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(255,255,255,0.45);
}

/* Footer */
.palette-foot {
  display: flex; gap: 16px; align-items: center;
  padding: 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.45);
}
kbd {
  font-family: 'Fira Mono', monospace; font-size: 9px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px; padding: 1px 5px; color: rgba(255,255,255,0.35);
  margin-right: 4px;
}

/* Transition */
.palette-enter-active, .palette-leave-active { transition: opacity 0.15s, transform 0.15s; }
.palette-enter-from, .palette-leave-to { opacity: 0; transform: scale(0.97) translateY(-8px); }
</style>
