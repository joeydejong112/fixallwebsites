<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useHead({ title: 'SPF / DKIM / DMARC Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Build SPF and DMARC TXT records visually with provider dropdowns, policy selectors, and copy-ready output. Fix email authentication issues — free.' })

const SPF_PROVIDERS: Record<string, string> = {
  'Google Workspace':  'include:_spf.google.com',
  'Microsoft 365':     'include:spf.protection.outlook.com',
  'Mailchimp':         'include:servers.mcsv.net',
  'SendGrid':          'include:sendgrid.net',
  'Resend':            'include:spf.resend.com',
  'Amazon SES':        'include:amazonses.com',
  'Zoho':              'include:zoho.com',
  'Mailgun':           'include:mailgun.org',
}

const spfProviders  = reactive<string[]>([])
const spfCustomIPs  = ref('')
const spfPolicy     = ref<'~all' | '-all'>('~all')
const spfNewProvider = ref('')

function addSpfProvider() {
  const p = spfNewProvider.value
  if (!p || spfProviders.includes(p)) return
  spfProviders.push(p)
  spfNewProvider.value = ''
}

function removeSpfProvider(p: string) {
  const i = spfProviders.indexOf(p)
  if (i > -1) spfProviders.splice(i, 1)
}

const spfRecord = computed(() => {
  const parts = ['v=spf1']
  for (const p of spfProviders) {
    const inc = SPF_PROVIDERS[p]
    if (inc) parts.push(inc)
  }
  if (spfCustomIPs.value.trim()) {
    spfCustomIPs.value.split(',').map(s => s.trim()).filter(Boolean).forEach(ip => {
      parts.push(ip.includes('/') || ip.includes('.') ? `ip4:${ip}` : `ip6:${ip}`)
    })
  }
  parts.push(spfPolicy.value)
  return parts.join(' ')
})

const dmarcPolicy    = ref<'none' | 'quarantine' | 'reject'>('quarantine')
const dmarcSubPolicy = ref<'none' | 'quarantine' | 'reject' | ''>('')
const dmarcRua       = ref('')
const dmarcPct       = ref(100)

const dmarcRecord = computed(() => {
  const parts = [`v=DMARC1`, `p=${dmarcPolicy.value}`]
  if (dmarcSubPolicy.value) parts.push(`sp=${dmarcSubPolicy.value}`)
  if (dmarcRua.value.trim()) parts.push(`rua=mailto:${dmarcRua.value.trim()}`)
  parts.push(`pct=${dmarcPct.value}`)
  return parts.join('; ')
})

// ── Custom provider dropdown ──────────────────────────────────────────────
const providerDropdownOpen = ref(false)
const providerDropdownEl   = ref<HTMLElement | null>(null)

function toggleProviderDropdown() {
  providerDropdownOpen.value = !providerDropdownOpen.value
}

function selectProvider(name: string) {
  spfNewProvider.value = name
  providerDropdownOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (providerDropdownEl.value && !providerDropdownEl.value.contains(e.target as Node)) {
    providerDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

const copiedSpf   = ref(false)
const copiedDmarc = ref(false)

async function copySpf() {
  await navigator.clipboard.writeText(spfRecord.value)
  copiedSpf.value = true; setTimeout(() => copiedSpf.value = false, 2000)
}
async function copyDmarc() {
  await navigator.clipboard.writeText(dmarcRecord.value)
  copiedDmarc.value = true; setTimeout(() => copiedDmarc.value = false, 2000)
}
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <div class="tool-header">
        <div class="tool-badge">DNS &amp; Email</div>
        <h1 class="tool-title">SPF / DKIM / DMARC Generator</h1>
        <p class="tool-subtitle">Build valid email authentication DNS records visually. Select your email providers, set policies, and copy the TXT record values.</p>
      </div>

      <div class="sections">

        <!-- SPF -->
        <div class="record-section">
          <div class="record-header">
            <div class="record-header-text">
              <h2 class="record-title">SPF Record</h2>
              <p class="record-subtitle">Specify which servers are allowed to send email for your domain.</p>
            </div>
            <span class="record-dns-hint">Add to: <code>@ TXT</code></span>
          </div>

          <div class="record-body">
            <!-- Providers -->
            <div class="field">
              <label class="field-label">Email providers</label>
              <div class="provider-chips">
                <span v-for="p in spfProviders" :key="p" class="pchip">
                  {{ p }}
                  <button class="pchip-remove" @click="removeSpfProvider(p)">×</button>
                </span>
              </div>
              <div class="add-row">
                <div class="custom-dropdown" ref="providerDropdownEl">
                  <button class="dropdown-trigger" @click="toggleProviderDropdown">
                    <span class="dropdown-value" :class="{ 'dropdown-value--placeholder': !spfNewProvider }">
                      {{ spfNewProvider || 'Select provider…' }}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow" :class="{ 'dropdown-arrow--open': providerDropdownOpen }">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                  <div v-if="providerDropdownOpen" class="dropdown-menu">
                    <button
                      v-for="(_, name) in SPF_PROVIDERS"
                      :key="name"
                      class="dropdown-item"
                      :class="{ 'dropdown-item--selected': spfNewProvider === name, 'dropdown-item--added': spfProviders.includes(name) }"
                      @click="selectProvider(name)"
                    >
                      <span>{{ name }}</span>
                      <svg v-if="spfProviders.includes(name)" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="color:#00d4aa;flex-shrink:0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </button>
                  </div>
                </div>
                <button class="add-btn" @click="addSpfProvider">Add</button>
              </div>
            </div>

            <!-- Custom IPs -->
            <div class="field">
              <label class="field-label">Custom IP ranges (comma-separated)</label>
              <input v-model="spfCustomIPs" class="field-input" type="text" placeholder="192.168.1.0/24, 10.0.0.1" />
            </div>

            <!-- Policy -->
            <div class="field">
              <label class="field-label">Policy</label>
              <div class="policy-toggle">
                <button
                  class="policy-btn"
                  :class="{ 'policy-btn--active': spfPolicy === '~all' }"
                  @click="spfPolicy = '~all'"
                >~all (softfail)</button>
                <button
                  class="policy-btn policy-btn--hard"
                  :class="{ 'policy-btn--active': spfPolicy === '-all' }"
                  @click="spfPolicy = '-all'"
                >-all (hardfail)</button>
              </div>
              <p class="field-hint">Use <code>-all</code> when you're confident all senders are listed. <code>~all</code> is safer to start.</p>
            </div>

            <!-- Output -->
            <div class="record-output">
              <div class="record-output-header">
                <div class="record-output-label-group">
                  <span class="output-dot"></span>
                  <span class="record-output-label">TXT record value</span>
                </div>
                <button class="copy-btn" @click="copySpf">
                  <svg v-if="!copiedSpf" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copiedSpf ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="record-value spf-value"><span class="token-prefix">v=spf1</span><template v-for="p in spfProviders" :key="p"><template v-if="SPF_PROVIDERS[p]"> <span class="token-include">include:</span><span class="token-domain">{{ SPF_PROVIDERS[p].replace('include:', '') }}</span></template></template><template v-if="spfCustomIPs.trim()"><template v-for="ip in spfCustomIPs.split(',').map(s => s.trim()).filter(Boolean)" :key="ip"> <span class="token-ip">{{ ip.includes('/') || ip.includes('.') ? 'ip4:' : 'ip6:' }}{{ ip }}</span></template></template> <span class="token-policy">{{ spfPolicy }}</span></pre>
            </div>
          </div>
        </div>

        <!-- DMARC -->
        <div class="record-section">
          <div class="record-header">
            <div class="record-header-text">
              <h2 class="record-title">DMARC Record</h2>
              <p class="record-subtitle">Tell receiving servers what to do with emails that fail SPF or DKIM checks.</p>
            </div>
            <span class="record-dns-hint">Add to: <code>_dmarc TXT</code></span>
          </div>

          <div class="record-body">
            <!-- Policy -->
            <div class="field">
              <label class="field-label">Policy (p=)</label>
              <div class="policy-toggle">
                <button class="policy-btn" :class="{ 'policy-btn--active': dmarcPolicy === 'none' }" @click="dmarcPolicy = 'none'">none</button>
                <button class="policy-btn" :class="{ 'policy-btn--active': dmarcPolicy === 'quarantine' }" @click="dmarcPolicy = 'quarantine'">quarantine</button>
                <button class="policy-btn policy-btn--hard" :class="{ 'policy-btn--active': dmarcPolicy === 'reject' }" @click="dmarcPolicy = 'reject'">reject</button>
              </div>
              <p class="field-hint">Start with <code>none</code> to monitor, move to <code>quarantine</code> then <code>reject</code> as you gain confidence.</p>
            </div>

            <!-- Reporting email -->
            <div class="field">
              <label class="field-label">Aggregate report email (rua=)</label>
              <input v-model="dmarcRua" class="field-input" type="text" placeholder="dmarc-reports@yourcompany.com" />
              <p class="field-hint">You'll receive daily XML reports about email authentication results.</p>
            </div>

            <!-- Subdomain policy -->
            <div class="field">
              <label class="field-label">Subdomain policy (sp= — optional)</label>
              <div class="policy-toggle">
                <button class="policy-btn" :class="{ 'policy-btn--active': dmarcSubPolicy === '' }" @click="dmarcSubPolicy = ''">same as p=</button>
                <button class="policy-btn" :class="{ 'policy-btn--active': dmarcSubPolicy === 'none' }" @click="dmarcSubPolicy = 'none'">none</button>
                <button class="policy-btn" :class="{ 'policy-btn--active': dmarcSubPolicy === 'quarantine' }" @click="dmarcSubPolicy = 'quarantine'">quarantine</button>
                <button class="policy-btn policy-btn--hard" :class="{ 'policy-btn--active': dmarcSubPolicy === 'reject' }" @click="dmarcSubPolicy = 'reject'">reject</button>
              </div>
            </div>

            <!-- Percentage -->
            <div class="field">
              <div class="field-label-row">
                <label class="field-label">Percentage (pct=)</label>
                <span class="pct-val">{{ dmarcPct }}%</span>
              </div>
              <input v-model.number="dmarcPct" type="range" min="1" max="100" class="pct-slider" />
              <p class="field-hint">Percentage of messages the policy applies to. Start at 10% and ramp up.</p>
            </div>

            <!-- Output -->
            <div class="record-output">
              <div class="record-output-header">
                <div class="record-output-label-group">
                  <span class="output-dot"></span>
                  <span class="record-output-label">TXT record value</span>
                </div>
                <button class="copy-btn" @click="copyDmarc">
                  <svg v-if="!copiedDmarc" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copiedDmarc ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="record-value dmarc-value"><span class="token-key">v</span><span class="token-eq">=</span><span class="token-val">DMARC1</span>; <span class="token-key">p</span><span class="token-eq">=</span><span class="token-val">{{ dmarcPolicy }}</span><template v-if="dmarcSubPolicy">; <span class="token-key">sp</span><span class="token-eq">=</span><span class="token-val">{{ dmarcSubPolicy }}</span></template><template v-if="dmarcRua.trim()">; <span class="token-key">rua</span><span class="token-eq">=</span><span class="token-val">mailto:{{ dmarcRua.trim() }}</span></template>; <span class="token-key">pct</span><span class="token-eq">=</span><span class="token-val">{{ dmarcPct }}</span></pre>
            </div>
          </div>
        </div>

        <!-- DKIM info -->
        <div class="record-section">
          <div class="record-header">
            <div class="record-header-text">
              <h2 class="record-title">DKIM</h2>
              <p class="record-subtitle">DKIM keys are generated by your email provider — we can't create them here.</p>
            </div>
          </div>
          <div class="record-body">
            <div class="dkim-info">
              <p class="dkim-intro">DKIM requires your provider to generate a public/private key pair. Find setup instructions for your provider:</p>
              <ul class="dkim-list">
                <li><span class="dkim-dot"></span><span><strong>Google Workspace</strong> — Admin Console → Gmail → Authenticate email</span></li>
                <li><span class="dkim-dot"></span><span><strong>Microsoft 365</strong> — Security admin center → Email authentication</span></li>
                <li><span class="dkim-dot"></span><span><strong>Mailchimp</strong> — Account → Domains → Authenticate</span></li>
                <li><span class="dkim-dot"></span><span><strong>SendGrid</strong> — Settings → Sender Authentication → Domain Authentication</span></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Pro -->
        <div class="pro-section">
          <div class="pro-section-header">
            <div class="pro-header-left">
              <span class="section-dot"></span>
              <span class="pro-label">Check my domain</span>
            </div>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Query live DNS and analyze your current records">
            <div class="pro-placeholder">
              <p class="pro-placeholder-text">Enter your domain → query live DNS → see your current SPF, DMARC, and DKIM records with analysis and recommendations.</p>
            </div>
          </ProGate>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 860px; margin: 0 auto; padding: 48px 28px 80px; }

/* Header */
.tool-header { margin-bottom: 32px; }
.tool-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 3px; margin-bottom: 12px;
  color: #fd79a8;
  background: rgba(253, 121, 168, 0.1);
  border: 1px solid rgba(253, 121, 168, 0.2);
}
.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: white; letter-spacing: -0.03em; margin-bottom: 10px;
}
.tool-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  color: rgba(255,255,255,0.50); line-height: 1.6; max-width: 560px;
}

/* Sections */
.sections { display: flex; flex-direction: column; gap: 16px; }

.record-section {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; overflow: hidden;
  border-left: 3px solid rgba(253,121,168,0.3);
}

.record-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04);
  flex-wrap: wrap;
}
.record-header-text { display: flex; flex-direction: column; gap: 4px; }
.record-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700;
  color: white; margin: 0;
}
.record-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); margin: 0;
}
.record-dns-hint {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.50); flex-shrink: 0; padding-top: 2px;
}
.record-dns-hint code {
  font-family: 'Fira Mono', monospace;
  background: rgba(253,121,168,0.08);
  color: #fd79a8;
  padding: 2px 7px; border-radius: 4px;
  border: 1px solid rgba(253,121,168,0.15);
}

.record-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 7px; }
.field-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.35);
}
.field-label-row { display: flex; justify-content: space-between; align-items: center; }
.field-input {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px; padding: 8px 12px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.7); outline: none;
  width: 100%; box-sizing: border-box; transition: border-color 0.15s;
}
.field-input:focus { border-color: rgba(253,121,168,0.35); }
.field-input::placeholder { color: rgba(255,255,255,0.15); }
.field-hint {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); line-height: 1.5; margin: 0;
}
.field-hint code {
  font-family: 'Fira Mono', monospace; background: rgba(255,255,255,0.06);
  padding: 1px 4px; border-radius: 3px; color: rgba(255,255,255,0.4);
}

/* Provider chips */
.provider-chips { display: flex; flex-wrap: wrap; gap: 6px; min-height: 24px; }
.pchip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: #fd79a8; background: rgba(253,121,168,0.08);
  border: 1px solid rgba(253,121,168,0.2);
  padding: 4px 10px; border-radius: 20px;
}
.pchip-remove {
  background: none; border: none; cursor: pointer; color: inherit;
  opacity: 0.5; font-size: 14px; padding: 0; transition: opacity 0.15s;
}
.pchip-remove:hover { opacity: 1; }

.add-row { display: flex; gap: 8px; align-items: flex-start; }

/* ── Custom dropdown ─────────────────────────────────────────── */
.custom-dropdown { position: relative; flex: 1; }

.dropdown-trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px; padding: 8px 12px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.7); transition: border-color 0.15s;
  text-align: left;
}
.dropdown-trigger:hover { border-color: rgba(253,121,168,0.3); }

.dropdown-value { flex: 1; }
.dropdown-value--placeholder { color: rgba(255,255,255,0.3); }

.dropdown-arrow { color: rgba(255,255,255,0.3); transition: transform 0.2s; flex-shrink: 0; }
.dropdown-arrow--open { transform: rotate(180deg); }

.dropdown-menu {
  position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 200;
  background: #1c1c26; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
}
.dropdown-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; text-align: left; padding: 9px 14px; gap: 8px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.6);
  background: none; border: none; cursor: pointer;
  transition: background 0.1s, color 0.1s;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:hover { background: rgba(253,121,168,0.07); color: rgba(255,255,255,0.9); }
.dropdown-item--selected { color: #fd79a8; }
.dropdown-item--added { color: rgba(255,255,255,0.35); }
.add-btn {
  background: rgba(253,121,168,0.1); border: 1px solid rgba(253,121,168,0.25);
  border-radius: 5px; padding: 7px 16px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #fd79a8; cursor: pointer; transition: background 0.15s;
}
.add-btn:hover { background: rgba(253,121,168,0.18); }

/* Policy toggle */
.policy-toggle { display: flex; gap: 6px; flex-wrap: wrap; }
.policy-btn {
  font-family: 'Fira Mono', monospace; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 5px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s;
}
.policy-btn--active {
  background: rgba(253,121,168,0.1);
  border-color: rgba(253,121,168,0.3);
  color: #fd79a8;
}
.policy-btn--hard.policy-btn--active {
  background: rgba(255,71,87,0.1);
  border-color: rgba(255,71,87,0.3);
  color: #ff4757;
}

/* Pct slider */
.pct-slider { width: 100%; accent-color: #fd79a8; cursor: pointer; }
.pct-val {
  font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700;
  color: #fd79a8;
}

/* Record output */
.record-output {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; overflow: hidden;
}
.record-output-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.record-output-label-group { display: flex; align-items: center; gap: 7px; }
.output-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #fd79a8; flex-shrink: 0;
}
.record-output-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.record-value {
  font-family: 'Fira Mono', monospace; font-size: 12px;
  color: rgba(255,255,255,0.7); line-height: 1.6;
  padding: 14px 16px; margin: 0; white-space: pre-wrap; word-break: break-all;
}

/* SPF syntax colors */
.token-prefix { color: #fd79a8; }
.token-include { color: #a29bfe; }
.token-domain { color: rgba(255,255,255,0.9); }
.token-ip { color: #74b9ff; }
.token-policy { color: #ffaa00; }

/* DMARC syntax colors */
.token-key { color: #fd79a8; }
.token-eq { color: rgba(255,255,255,0.3); }
.token-val { color: rgba(255,255,255,0.9); }

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #fd79a8; background: rgba(253,121,168,0.08);
  border: 1px solid rgba(253,121,168,0.2);
  border-radius: 4px; padding: 4px 10px; cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(253,121,168,0.18); }

/* DKIM info */
.dkim-info { display: flex; flex-direction: column; gap: 12px; }
.dkim-intro {
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.50); line-height: 1.6; margin: 0;
}
.dkim-list {
  margin: 0; padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 8px;
}
.dkim-list li {
  display: flex; align-items: flex-start; gap: 9px;
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); line-height: 1.5;
}
.dkim-list li strong { color: rgba(255,255,255,0.65); font-weight: 600; }
.dkim-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #fd79a8; flex-shrink: 0; margin-top: 6px;
}

/* Pro */
.pro-section {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; overflow: hidden;
  border-left: 3px solid rgba(253,121,168,0.3);
}
.pro-section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-header-left { display: flex; align-items: center; gap: 7px; }
.section-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #fd79a8; flex-shrink: 0;
}
.pro-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}
.pro-placeholder { padding: 20px; }
.pro-placeholder-text {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.50); margin: 0; line-height: 1.5;
}
</style>
