<script setup lang="ts">
useHead({ title: 'Robots.txt Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Build a valid robots.txt visually with user-agent rules, allow/disallow paths, sitemap URL, and crawl-delay. Download the file or copy to clipboard — free.' })

interface Rule {
  path: string
  allow: boolean
}

interface Agent {
  id: number
  userAgent: string
  crawlDelay: string
  rules: Rule[]
}

let agentId = 0

const sitemapUrl  = ref('')
const agents      = reactive<Agent[]>([])

function addAgent() {
  agents.push({ id: agentId++, userAgent: '*', crawlDelay: '', rules: [{ path: '/', allow: true }] })
}

function removeAgent(id: number) {
  const i = agents.findIndex(a => a.id === id)
  if (i > -1) agents.splice(i, 1)
}

function addRule(agent: Agent) {
  agent.rules.push({ path: '/', allow: true })
}

function removeRule(agent: Agent, i: number) {
  agent.rules.splice(i, 1)
}

// ── Presets ────────────────────────────────────────────────────────────────
function applyPreset(preset: string) {
  agents.splice(0, agents.length)
  sitemapUrl.value = ''
  if (preset === 'allow') {
    agents.push({ id: agentId++, userAgent: '*', crawlDelay: '', rules: [{ path: '/', allow: true }] })
  } else if (preset === 'block') {
    agents.push({ id: agentId++, userAgent: '*', crawlDelay: '', rules: [{ path: '/', allow: false }] })
  } else if (preset === 'folders') {
    agents.push({ id: agentId++, userAgent: '*', crawlDelay: '', rules: [
      { path: '/', allow: true },
      { path: '/admin/', allow: false },
      { path: '/private/', allow: false },
      { path: '/tmp/', allow: false },
    ]})
  } else if (preset === 'wordpress') {
    agents.push({ id: agentId++, userAgent: '*', crawlDelay: '', rules: [
      { path: '/', allow: true },
      { path: '/wp-admin/', allow: false },
      { path: '/wp-includes/', allow: false },
    ]})
    sitemapUrl.value = 'https://yoursite.com/sitemap.xml'
  }
}

// ── Output ─────────────────────────────────────────────────────────────────
const output = computed(() => {
  const lines: string[] = []
  for (const agent of agents) {
    lines.push(`User-agent: ${agent.userAgent || '*'}`)
    if (agent.crawlDelay) lines.push(`Crawl-delay: ${agent.crawlDelay}`)
    for (const rule of agent.rules) {
      lines.push(`${rule.allow ? 'Allow' : 'Disallow'}: ${rule.path}`)
    }
    lines.push('')
  }
  if (sitemapUrl.value) lines.push(`Sitemap: ${sitemapUrl.value}`)
  return lines.join('\n').trim()
})

const copied = ref(false)
async function copyOutput() {
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function download() {
  const blob = new Blob([output.value], { type: 'text/plain' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = 'robots.txt'
  a.click()
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(() => applyPreset('allow'))
</script>

<template>
  <div class="page-bg">
    <NavBar />
    <div class="tool-shell">

      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <div class="tool-header">
        <div class="tool-badge" style="color:#6c5ce7;background:rgba(108,92,231,0.1)">SEO</div>
        <h1 class="tool-title">Robots.txt Generator</h1>
        <p class="tool-subtitle">Build a valid <code>robots.txt</code> with user-agent rules, allow/disallow paths, sitemap URL, and crawl-delay. Download the file or copy to clipboard.</p>
      </div>

      <!-- Presets -->
      <div class="presets-row">
        <span class="presets-label">Presets:</span>
        <button class="preset-chip" @click="applyPreset('allow')">Allow all</button>
        <button class="preset-chip" @click="applyPreset('block')">Block all</button>
        <button class="preset-chip" @click="applyPreset('folders')">Block folders</button>
        <button class="preset-chip" @click="applyPreset('wordpress')">WordPress</button>
      </div>

      <div class="tool-columns">

        <!-- ── Editor ────────────────────────────────────────────── -->
        <div class="editor-col">

          <!-- Sitemap -->
          <div class="form-card">
            <label class="field-label">Sitemap URL (optional)</label>
            <input v-model="sitemapUrl" class="field-input" type="url" placeholder="https://yoursite.com/sitemap.xml" />
          </div>

          <!-- Agent blocks -->
          <div v-for="agent in agents" :key="agent.id" class="agent-card">
            <div class="agent-header">
              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">User-agent</label>
                  <input v-model="agent.userAgent" class="field-input field-input--sm" list="bots" placeholder="*" />
                  <datalist id="bots">
                    <option value="*" />
                    <option value="Googlebot" />
                    <option value="Bingbot" />
                    <option value="Slurp" />
                    <option value="DuckDuckBot" />
                  </datalist>
                </div>
                <div class="field-group">
                  <label class="field-label">Crawl-delay</label>
                  <input v-model="agent.crawlDelay" class="field-input field-input--sm" type="number" min="0" placeholder="none" />
                </div>
                <button class="remove-agent-btn" @click="removeAgent(agent.id)">Remove</button>
              </div>
            </div>

            <!-- Rules -->
            <div class="rules-list">
              <div v-for="(rule, ri) in agent.rules" :key="ri" class="rule-row">
                <select v-model="rule.allow" class="allow-select">
                  <option :value="true">Allow</option>
                  <option :value="false">Disallow</option>
                </select>
                <input v-model="rule.path" class="field-input rule-path-input" type="text" placeholder="/path/" />
                <button class="remove-rule-btn" @click="removeRule(agent, ri)">×</button>
              </div>
            </div>

            <button class="add-rule-btn" @click="addRule(agent)">+ Add rule</button>
          </div>

          <button class="add-agent-btn" @click="addAgent">+ Add user-agent block</button>
        </div>

        <!-- ── Output ─────────────────────────────────────────────── -->
        <div class="output-col">
          <div class="output-card">
            <div class="output-header">
              <p class="output-label">robots.txt</p>
              <div class="output-actions">
                <button class="copy-btn" @click="copyOutput">
                  <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
                <button class="download-btn" @click="download">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  Download
                </button>
              </div>
            </div>
            <pre class="output-code">{{ output || '# Add a user-agent block to get started' }}</pre>
          </div>

          <!-- Pro -->
          <div class="output-card" style="margin-top:16px">
            <div class="output-header">
              <p class="output-label">URL tester & live fetch</p>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Test URLs & fetch your current robots.txt">
              <div style="padding:20px">
                <p style="font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.2);margin:0">Enter a URL to check if it would be crawled or blocked. Fetch your current robots.txt for comparison.</p>
              </div>
            </ProGate>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 1080px; margin: 0 auto; padding: 100px 24px 80px; }

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.3); text-decoration: none;
  margin-bottom: 32px; transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.7); }

.tool-header { margin-bottom: 24px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.38); line-height: 1.6; max-width: 580px;
}
.tool-subtitle code {
  font-family: monospace; font-size: 13px;
  background: rgba(255,255,255,0.07); padding: 1px 5px; border-radius: 3px;
  color: rgba(255,255,255,0.55);
}

/* ── Presets ─────────────────────────────────────────────── */
.presets-row {
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap; margin-bottom: 24px;
}
.presets-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.25);
}
.preset-chip {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 12px; border-radius: 20px;
  background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.2);
  color: #6c5ce7; cursor: pointer; transition: background 0.15s;
}
.preset-chip:hover { background: rgba(108,92,231,0.18); }

/* ── Layout ──────────────────────────────────────────────── */
.tool-columns {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 20px; align-items: start;
}
@media (max-width: 768px) { .tool-columns { grid-template-columns: 1fr; } }

/* ── Editor ──────────────────────────────────────────────── */
.editor-col { display: flex; flex-direction: column; gap: 12px; }

.form-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}

.agent-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}

.agent-header { display: flex; flex-direction: column; gap: 8px; }

.field-row { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
.field-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 80px; }

.field-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3);
}

.field-input {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px; padding: 7px 10px;
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.7); outline: none; transition: border-color 0.15s;
  width: 100%; box-sizing: border-box;
}
.field-input:focus { border-color: rgba(108,92,231,0.4); }
.field-input::placeholder { color: rgba(255,255,255,0.15); }
.field-input--sm { max-width: 120px; }

.remove-agent-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: rgba(255,71,87,0.5); background: rgba(255,71,87,0.06);
  border: 1px solid rgba(255,71,87,0.15); border-radius: 4px;
  padding: 6px 10px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.remove-agent-btn:hover { color: #ff4757; background: rgba(255,71,87,0.12); }

/* ── Rules ───────────────────────────────────────────────── */
.rules-list { display: flex; flex-direction: column; gap: 6px; }
.rule-row { display: flex; gap: 6px; align-items: center; }

.allow-select {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px; padding: 7px 8px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.6); outline: none; cursor: pointer; flex-shrink: 0;
}

.rule-path-input { flex: 1; }

.remove-rule-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2); font-size: 16px; padding: 4px 6px;
  flex-shrink: 0; transition: color 0.15s;
}
.remove-rule-btn:hover { color: #ff4757; }

.add-rule-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.3); background: none; border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 5px; padding: 7px; cursor: pointer; transition: all 0.15s;
}
.add-rule-btn:hover { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }

.add-agent-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: #6c5ce7; background: rgba(108,92,231,0.08);
  border: 1px dashed rgba(108,92,231,0.25);
  border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.15s;
}
.add-agent-btn:hover { background: rgba(108,92,231,0.14); }

/* ── Output ──────────────────────────────────────────────── */
.output-col { display: flex; flex-direction: column; }
.output-card {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}
.output-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.output-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.25); margin: 0;
}
.output-actions { display: flex; gap: 6px; }
.output-code {
  font-family: 'Fira Mono', monospace; font-size: 12px;
  color: rgba(255,255,255,0.65); line-height: 1.7;
  padding: 16px 18px; margin: 0; white-space: pre-wrap;
  min-height: 120px;
}
.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #ec3586; background: rgba(236,53,134,0.08);
  border: 1px solid rgba(236,53,134,0.2);
  border-radius: 4px; padding: 5px 10px; cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(236,53,134,0.15); }
.download-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #6c5ce7; background: rgba(108,92,231,0.1);
  border: 1px solid rgba(108,92,231,0.2);
  border-radius: 4px; padding: 5px 10px; cursor: pointer; transition: background 0.15s;
}
.download-btn:hover { background: rgba(108,92,231,0.18); }
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}
</style>
