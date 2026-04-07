<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useHead({ title: 'AI Optimizer & llms.txt Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Generate a valid llms.txt file for LLM ingestion and build AI-friendly robots.txt rules for GPTBot, ClaudeBot, Perplexity, and Google-Extended — free.' })

// ── llms.txt Generator ────────────────────────────────────────────────────────
const siteName   = ref('')
const siteDesc   = ref('')
const audience   = ref('')
const docsUrl    = ref('')
const pricingUrl = ref('')
const blogUrl    = ref('')
const apiUrl     = ref('')
const contactEmail = ref('')

const llmsOutput = computed(() => {
  const lines: string[] = []
  lines.push(`# ${siteName.value || 'Your Site Name'}`)
  lines.push('')
  if (siteDesc.value) {
    lines.push('## Summary')
    lines.push(siteDesc.value)
    lines.push('')
  }
  if (audience.value) {
    lines.push('## Audience')
    lines.push(audience.value)
    lines.push('')
  }
  const urlFields = [
    { label: 'Documentation', url: docsUrl.value },
    { label: 'Pricing',       url: pricingUrl.value },
    { label: 'Blog',          url: blogUrl.value },
    { label: 'API Reference', url: apiUrl.value },
  ].filter(f => f.url)
  if (urlFields.length) {
    lines.push('## Key Pages')
    for (const f of urlFields) lines.push(`- [${f.label}](${f.url})`)
    lines.push('')
  }
  if (contactEmail.value) {
    lines.push('## Contact')
    lines.push(contactEmail.value)
  }
  return lines.join('\n').trim()
})

function downloadLlmsTxt() {
  const blob = new Blob([llmsOutput.value], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'llms.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// ── AI Crawler robots.txt Builder ─────────────────────────────────────────────
type CrawlerPolicy = 'allow' | 'block' | 'partial'

interface CrawlerEntry {
  agent: string
  label: string
  policy: CrawlerPolicy
  paths: string
}

const crawlers = reactive<CrawlerEntry[]>([
  { agent: 'GPTBot',          label: 'GPTBot (ChatGPT training)',    policy: 'allow', paths: '' },
  { agent: 'ChatGPT-User',    label: 'ChatGPT-User (browsing)',      policy: 'allow', paths: '' },
  { agent: 'Google-Extended', label: 'Google-Extended (AI overview)', policy: 'allow', paths: '' },
  { agent: 'ClaudeBot',       label: 'ClaudeBot (Claude)',           policy: 'allow', paths: '' },
  { agent: 'PerplexityBot',   label: 'PerplexityBot (Perplexity)',   policy: 'allow', paths: '' },
  { agent: 'anthropic-ai',    label: 'anthropic-ai (Anthropic)',     policy: 'allow', paths: '' },
])

const robotsSnippet = computed(() => {
  const lines: string[] = []
  for (const c of crawlers) {
    lines.push(`User-agent: ${c.agent}`)
    if (c.policy === 'allow') {
      lines.push('Allow: /')
    } else if (c.policy === 'block') {
      lines.push('Disallow: /')
    } else {
      const paths = c.paths.split('\n').map(p => p.trim()).filter(Boolean)
      lines.push('Allow: /')
      for (const p of paths) lines.push(`Disallow: ${p}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
})

// ── Clipboard helpers ─────────────────────────────────────────────────────────
const copiedLlms   = ref(false)
const copiedRobots = ref(false)

function copyText(text: string, flag: Ref<boolean>) {
  navigator.clipboard.writeText(text)
  flag.value = true
  setTimeout(() => { flag.value = false }, 2000)
}
</script>

<template>
  <div class="tool-page">
    <!-- Header -->
    <div class="tool-header">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(255,118,117,0.1); border: 1px solid rgba(255,118,117,0.2)">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#ff7675" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <span class="text-[11px] font-display font-bold tracking-[0.2em] uppercase" style="color: #ff7675">AI Readiness</span>
      </div>
      <h1 class="tool-title">AI Optimizer &amp; <span style="color: #ff7675">llms.txt</span> Generator</h1>
      <p class="tool-subtitle">Make your site discoverable and citable by ChatGPT, Perplexity, Claude, and Google AI Overviews.</p>
    </div>

    <div class="tool-body">

      <!-- ── Section 1: llms.txt Generator ──────────────────────────────── -->
      <div class="tool-section">
        <div class="tool-section-header">
          <div class="tool-section-badge free">Free</div>
          <h2 class="tool-section-title">llms.txt Generator</h2>
        </div>
        <p class="tool-section-desc">Generate a valid <code>llms.txt</code> file — a curated summary that tells AI crawlers what your site is, who it's for, and where to find key content.</p>

        <div class="tool-grid-2">
          <!-- Inputs -->
          <div class="space-y-4">
            <div class="input-wrapper">
              <label class="input-label">Site name <span class="required">*</span></label>
              <input v-model="siteName" type="text" class="input-field" placeholder="Acme Corp" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Short description</label>
              <textarea v-model="siteDesc" class="input-field" rows="3" placeholder="One-paragraph description of what your site does and who it's for." />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Target audience</label>
              <input v-model="audience" type="text" class="input-field" placeholder="Developers, marketers, and agency clients" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Documentation URL</label>
              <input v-model="docsUrl" type="url" class="input-field" placeholder="https://yourdomain.com/docs" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Pricing URL</label>
              <input v-model="pricingUrl" type="url" class="input-field" placeholder="https://yourdomain.com/pricing" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Blog URL</label>
              <input v-model="blogUrl" type="url" class="input-field" placeholder="https://yourdomain.com/blog" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">API Reference URL</label>
              <input v-model="apiUrl" type="url" class="input-field" placeholder="https://yourdomain.com/api" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Contact email</label>
              <input v-model="contactEmail" type="email" class="input-field" placeholder="support@yourdomain.com" />
            </div>
          </div>

          <!-- Output -->
          <div>
            <div class="output-header">
              <span class="output-label">llms.txt</span>
              <div class="flex gap-2">
                <button class="copy-btn" @click="copyText(llmsOutput, copiedLlms)">
                  {{ copiedLlms ? 'Copied!' : 'Copy' }}
                </button>
                <button class="download-btn" @click="downloadLlmsTxt">Download</button>
              </div>
            </div>
            <div class="output-box">
              <pre class="output-pre">{{ llmsOutput || '# Your Site Name\n\n## Summary\n...' }}</pre>
            </div>
            <p class="output-hint">Place this file at <code>/public/llms.txt</code> so it's served at <code>https://yourdomain.com/llms.txt</code></p>
          </div>
        </div>
      </div>

      <!-- ── Section 2: AI Crawler robots.txt Builder ────────────────────── -->
      <div class="tool-section">
        <div class="tool-section-header">
          <div class="tool-section-badge free">Free</div>
          <h2 class="tool-section-title">AI Crawler robots.txt Builder</h2>
        </div>
        <p class="tool-section-desc">Control which AI crawlers can index your site. Generates a pasteable <code>robots.txt</code> snippet.</p>

        <div class="tool-grid-2">
          <!-- Crawler toggles -->
          <div class="space-y-3">
            <div
              v-for="c in crawlers"
              :key="c.agent"
              class="crawler-row"
            >
              <div class="flex-1">
                <p class="crawler-name">{{ c.agent }}</p>
                <p class="crawler-label">{{ c.label }}</p>
              </div>
              <div class="flex gap-1.5">
                <button
                  class="policy-btn"
                  :class="c.policy === 'allow' ? 'policy-btn--allow' : ''"
                  @click="c.policy = 'allow'; c.paths = ''"
                >Allow</button>
                <button
                  class="policy-btn"
                  :class="c.policy === 'partial' ? 'policy-btn--partial' : ''"
                  @click="c.policy = 'partial'"
                >Partial</button>
                <button
                  class="policy-btn"
                  :class="c.policy === 'block' ? 'policy-btn--block' : ''"
                  @click="c.policy = 'block'; c.paths = ''"
                >Block</button>
              </div>
              <div v-if="c.policy === 'partial'" class="w-full mt-2">
                <textarea
                  v-model="c.paths"
                  class="input-field text-xs"
                  rows="2"
                  placeholder="Disallow paths (one per line, e.g. /private)"
                />
              </div>
            </div>
          </div>

          <!-- Output -->
          <div>
            <div class="output-header">
              <span class="output-label">robots.txt snippet</span>
              <button class="copy-btn" @click="copyText(robotsSnippet, copiedRobots)">
                {{ copiedRobots ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <div class="output-box">
              <pre class="output-pre">{{ robotsSnippet }}</pre>
            </div>
            <p class="output-hint">Paste this into your <code>robots.txt</code> file, or replace your existing AI crawler rules.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.tool-page  { max-width: 900px; margin: 0 auto; padding: 7rem 2rem 4rem; }
.tool-header { margin-bottom: 2.5rem; }
.tool-title  { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: white; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 0.75rem; }
.tool-subtitle { font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.5); max-width: 50ch; }

.tool-body    { display: flex; flex-direction: column; gap: 2.5rem; }
.tool-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.75rem 2rem; }

.tool-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; }
.tool-section-title  { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 700; color: white; letter-spacing: -0.02em; }
.tool-section-desc   { font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: rgba(255,255,255,0.45); margin-bottom: 1.5rem; line-height: 1.6; }
.tool-section-desc code { font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 0 5px; border-radius: 4px; color: rgba(255,255,255,0.7); }

.tool-section-badge { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; }
.tool-section-badge.free { background: rgba(0,212,170,0.1); color: #00d4aa; border: 1px solid rgba(0,212,170,0.2); }

.tool-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 640px) { .tool-grid-2 { grid-template-columns: 1fr; } }

.input-label  { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
.required     { color: #ff7675; }
.input-field  { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 9px 12px; color: rgba(255,255,255,0.85); font-family: 'DM Sans', sans-serif; font-size: 0.875rem; transition: border-color 0.15s; outline: none; resize: vertical; }
.input-field:focus { border-color: rgba(255,118,117,0.4); }
.input-wrapper { display: flex; flex-direction: column; }

.output-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.output-label  { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
.output-box    { background: #07070a; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 16px; min-height: 200px; overflow: auto; }
.output-pre    { font-size: 12px; font-family: 'Fira Code', 'Courier New', monospace; color: rgba(255,255,255,0.7); white-space: pre-wrap; word-break: break-word; margin: 0; line-height: 1.7; }
.output-hint   { margin-top: 8px; font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); }
.output-hint code { font-size: 10px; background: rgba(255,255,255,0.05); padding: 0 4px; border-radius: 3px; color: rgba(255,255,255,0.5); }

.copy-btn     { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 5px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: rgba(255,255,255,0.55); cursor: pointer; transition: all 0.15s; }
.copy-btn:hover { background: rgba(255,255,255,0.08); color: white; }
.download-btn { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 5px 12px; background: rgba(255,118,117,0.1); border: 1px solid rgba(255,118,117,0.25); border-radius: 6px; color: #ff7675; cursor: pointer; transition: all 0.15s; }
.download-btn:hover { background: rgba(255,118,117,0.18); }

.crawler-row  { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; }
.crawler-name { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8); }
.crawler-label { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.35); }

.policy-btn   { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.12s; }
.policy-btn:hover { color: rgba(255,255,255,0.65); }
.policy-btn--allow   { background: rgba(0,212,170,0.1); border-color: rgba(0,212,170,0.25); color: #00d4aa; }
.policy-btn--partial { background: rgba(255,170,0,0.1); border-color: rgba(255,170,0,0.25); color: #ffaa00; }
.policy-btn--block   { background: rgba(255,71,87,0.1); border-color: rgba(255,71,87,0.25); color: #ff4757; }
</style>
