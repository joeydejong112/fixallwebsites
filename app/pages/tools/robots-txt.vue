<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useSeoMeta({
  title: 'Free Robots.txt Generator & Editor — ScanPulse Tools',
  description: 'Create and edit robots.txt visually. Set user-agent rules, allow/disallow paths, add your sitemap URL, and apply presets. Download or copy — free.',
  ogTitle: 'Free Robots.txt Generator & Editor',
  ogDescription: 'Build a valid robots.txt file visually with user-agent rules, path directives, and sitemap support.',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })

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

onMounted(() => applyPreset('allow'))

/* Syntax colorization for the output display */
interface OutputToken { text: string; cls: string }
const outputLines = computed<OutputToken[][]>(() => {
  if (!output.value) return []
  return output.value.split('\n').map(line => {
    if (line.startsWith('User-agent:')) {
      const [label, ...rest] = line.split(':')
      return [{ text: label + ':', cls: 'tok-ua' }, { text: rest.join(':'), cls: 'tok-val' }]
    }
    if (line.startsWith('Allow:')) {
      const [label, ...rest] = line.split(':')
      return [{ text: label + ':', cls: 'tok-allow' }, { text: rest.join(':'), cls: 'tok-val' }]
    }
    if (line.startsWith('Disallow:')) {
      const [label, ...rest] = line.split(':')
      return [{ text: label + ':', cls: 'tok-disallow' }, { text: rest.join(':'), cls: 'tok-val-dim' }]
    }
    if (line.startsWith('Sitemap:')) {
      const [label, ...rest] = line.split(':')
      return [{ text: label + ':', cls: 'tok-sitemap' }, { text: rest.join(':'), cls: 'tok-val' }]
    }
    if (line.startsWith('Crawl-delay:')) {
      const [label, ...rest] = line.split(':')
      return [{ text: label + ':', cls: 'tok-delay' }, { text: rest.join(':'), cls: 'tok-val' }]
    }
    return [{ text: line, cls: 'tok-empty' }]
  })
})
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <div class="tool-header">
        <div class="tool-badge">SEO</div>
        <h1 class="tool-title">Robots.txt Generator</h1>
        <p class="tool-subtitle">Build a valid <code>robots.txt</code> with user-agent rules, allow/disallow paths, sitemap URL, and crawl-delay. Download the file or copy to clipboard.</p>
      </div>

      <!-- Presets -->
      <div class="presets-row">
        <span class="presets-label">Presets</span>
        <button class="preset-chip" @click="applyPreset('allow')">Allow all</button>
        <button class="preset-chip" @click="applyPreset('block')">Block all</button>
        <button class="preset-chip" @click="applyPreset('folders')">Block folders</button>
        <button class="preset-chip" @click="applyPreset('wordpress')">WordPress</button>
      </div>

      <div class="tool-columns">

        <!-- Editor -->
        <div class="editor-col">

          <!-- Sitemap card -->
          <div class="form-card">
            <label class="field-label">Sitemap URL <span class="field-hint">(optional)</span></label>
            <input v-model="sitemapUrl" class="field-input" type="url" placeholder="https://yoursite.com/sitemap.xml" />
          </div>

          <!-- Agent blocks -->
          <div v-for="agent in agents" :key="agent.id" class="agent-card">
            <div class="agent-card-header">
              <div class="agent-title-row">
                <span class="agent-ua-label">User-agent:</span>
                <span class="agent-ua-value">{{ agent.userAgent || '*' }}</span>
              </div>
              <button class="remove-agent-btn" @click="removeAgent(agent.id)">Remove</button>
            </div>

            <div class="agent-fields-row">
              <div class="field-group">
                <label class="field-label">User-agent</label>
                <input v-model="agent.userAgent" class="field-input" list="bots" placeholder="*" />
                <datalist id="bots">
                  <option value="*" />
                  <option value="Googlebot" />
                  <option value="Bingbot" />
                  <option value="Slurp" />
                  <option value="DuckDuckBot" />
                </datalist>
              </div>
              <div class="field-group field-group--sm">
                <label class="field-label">Crawl-delay <span class="field-hint">(optional)</span></label>
                <input v-model="agent.crawlDelay" class="field-input" type="number" min="0" placeholder="none" />
              </div>
            </div>

            <!-- Rules -->
            <div class="rules-list">
              <div v-for="(rule, ri) in agent.rules" :key="ri" class="rule-row">
                <select v-model="rule.allow" class="allow-select" :class="rule.allow ? 'allow-select--allow' : 'allow-select--disallow'">
                  <option :value="true">Allow</option>
                  <option :value="false">Disallow</option>
                </select>
                <input v-model="rule.path" class="field-input rule-path-input" type="text" placeholder="/path/" />
                <button class="remove-rule-btn" @click="removeRule(agent, ri)" title="Remove rule">×</button>
              </div>
            </div>

            <button class="add-rule-btn" @click="addRule(agent)">+ Add rule</button>
          </div>

          <button class="add-agent-btn" @click="addAgent">+ Add user-agent block</button>
        </div>

        <!-- Output -->
        <div class="output-col">

          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot"></span>
                <p class="output-label">robots.txt</p>
              </div>
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

            <!-- Syntax-colored output -->
            <div class="output-body">
              <template v-if="outputLines.length">
                <div v-for="(tokens, li) in outputLines" :key="li" class="output-line">
                  <span v-if="tokens.length === 1 && tokens[0].cls === 'tok-empty'" class="tok-empty">&nbsp;</span>
                  <template v-else>
                    <span v-for="(tok, ti) in tokens" :key="ti" :class="tok.cls">{{ tok.text }}</span>
                  </template>
                </div>
              </template>
              <span v-else class="tok-comment"># Add a user-agent block to get started</span>
            </div>
          </div>

          <!-- Pro -->
          <div class="output-card pro-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot output-dot--pro"></span>
                <p class="output-label">URL tester &amp; live fetch</p>
              </div>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Test URLs & fetch your current robots.txt">
              <div class="pro-body">
                <p class="pro-hint">Enter a URL to check if it would be crawled or blocked. Fetch your current robots.txt for comparison.</p>
              </div>
            </ProGate>
          </div>
        </div>
      </div>
      <ToolSeoSection slug="robots-txt" />
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 100%; padding: 48px 28px 80px; }

/* ── Header ──────────────────────────────────────────────── */
.tool-header { margin-bottom: 24px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
  color: #6c5ce7;
  background: rgba(108,92,231,0.1);
  border: 1px solid rgba(108,92,231,0.2);
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.50); line-height: 1.6; max-width: 580px;
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
  letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.28);
}
.preset-chip {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  padding: 5px 13px; border-radius: 20px;
  background: rgba(108,92,231,0.09); border: 1px solid rgba(108,92,231,0.22);
  color: #8b7ef0; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.preset-chip:hover { background: rgba(108,92,231,0.18); color: #a89af5; }

/* ── Layout ──────────────────────────────────────────────── */
.tool-columns {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 20px; align-items: start;
}
@media (max-width: 768px) { .tool-columns { grid-template-columns: 1fr; } }

/* ── Editor column ───────────────────────────────────────── */
.editor-col { display: flex; flex-direction: column; gap: 12px; }

.form-card {
  background: #0c0c12; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}

.agent-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-left: 3px solid rgba(108,92,231,0.3);
  border-radius: 10px; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-left-color 0.2s;
}
.agent-card:hover { border-left-color: #6c5ce7; }

.agent-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.agent-title-row { display: flex; align-items: center; gap: 6px; }
.agent-ua-label {
  font-family: 'Fira Mono', monospace; font-size: 11px;
  color: #8b7ef0;
}
.agent-ua-value {
  font-family: 'Fira Mono', monospace; font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.75);
  background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.18);
  padding: 2px 7px; border-radius: 4px;
}

.agent-fields-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
.field-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 80px; }
.field-group--sm { flex: 0 0 110px; }

.field-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.32);
}
.field-hint {
  font-weight: 400; text-transform: none; letter-spacing: 0;
  color: rgba(255,255,255,0.50); font-size: 12px;
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

.remove-agent-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: rgba(255,71,87,0.5); background: rgba(255,71,87,0.06);
  border: 1px solid rgba(255,71,87,0.14); border-radius: 4px;
  padding: 5px 10px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.remove-agent-btn:hover { color: #ff4757; background: rgba(255,71,87,0.12); }

/* ── Rules ───────────────────────────────────────────────── */
.rules-list { display: flex; flex-direction: column; gap: 6px; }
.rule-row { display: flex; gap: 6px; align-items: center; }

.allow-select {
  border-radius: 5px; padding: 7px 8px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  outline: none; cursor: pointer; flex-shrink: 0;
  border: 1px solid transparent; transition: all 0.15s;
  appearance: none; -webkit-appearance: none;
  text-align: center;
}
.allow-select--allow {
  background: rgba(0,212,130,0.1); border-color: rgba(0,212,130,0.2);
  color: #00d482;
}
.allow-select--disallow {
  background: rgba(255,71,87,0.08); border-color: rgba(255,71,87,0.2);
  color: #ff6b78;
}

.rule-path-input { flex: 1; }

.remove-rule-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2); font-size: 16px; padding: 4px 6px;
  flex-shrink: 0; transition: color 0.15s; line-height: 1;
}
.remove-rule-btn:hover { color: #ff4757; }

.add-rule-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: rgba(108,92,231,0.6); background: none;
  border: 1px dashed rgba(108,92,231,0.22);
  border-radius: 5px; padding: 7px; cursor: pointer; transition: all 0.15s;
}
.add-rule-btn:hover { color: #8b7ef0; border-color: rgba(108,92,231,0.4); background: rgba(108,92,231,0.06); }

.add-agent-btn {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: #8b7ef0; background: rgba(108,92,231,0.07);
  border: 1px dashed rgba(108,92,231,0.28);
  border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.15s;
}
.add-agent-btn:hover { background: rgba(108,92,231,0.14); border-color: rgba(108,92,231,0.4); }

/* ── Output column ───────────────────────────────────────── */
.output-col {
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 104px);
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.output-col::-webkit-scrollbar { display: none; }

.output-card {
  background: #0c0c12; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}
.output-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}

/* Output title row with colored dot */
.output-title-row {
  display: flex; align-items: center; gap: 8px;
}
.output-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #6c5ce7;
  box-shadow: 0 0 6px rgba(108,92,231,0.5);
  flex-shrink: 0;
}
.output-dot--pro {
  background: #ec3586;
  box-shadow: 0 0 6px rgba(236,53,134,0.4);
}

.output-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); margin: 0;
}
.output-actions { display: flex; gap: 6px; }

/* Syntax-colored output body */
.output-body {
  font-family: 'Fira Mono', monospace; font-size: 12px;
  line-height: 1.75; padding: 16px 18px;
  min-height: 120px; white-space: pre-wrap;
}
.output-line { display: block; }

.tok-ua      { color: #8b7ef0; }
.tok-allow   { color: #00d482; }
.tok-disallow { color: rgba(255,107,120,0.7); }
.tok-sitemap { color: #ffaa44; }
.tok-delay   { color: rgba(255,255,255,0.5); }
.tok-val     { color: rgba(255,255,255,0.7); }
.tok-val-dim { color: rgba(255,255,255,0.4); }
.tok-empty   { color: transparent; user-select: none; }
.tok-comment { color: rgba(255,255,255,0.22); font-style: italic; }

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #8b7ef0; background: rgba(108,92,231,0.09);
  border: 1px solid rgba(108,92,231,0.22);
  border-radius: 4px; padding: 5px 10px; cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(108,92,231,0.18); }

.download-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #8b7ef0; background: transparent;
  border: 1px solid rgba(108,92,231,0.3);
  border-radius: 4px; padding: 5px 10px; cursor: pointer; transition: all 0.15s;
}
.download-btn:hover { background: rgba(108,92,231,0.1); }

.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}

.pro-body { padding: 20px; }
.pro-hint {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); margin: 0; line-height: 1.6;
}
</style>
