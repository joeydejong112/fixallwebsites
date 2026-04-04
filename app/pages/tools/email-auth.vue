<script setup lang="ts">
useHead({ title: 'SPF / DKIM / DMARC Generator — ScanPulse Tools' })
useSeoMeta({ description: 'Build SPF and DMARC TXT records visually with provider dropdowns, policy selectors, and copy-ready output. Fix email authentication issues — free.' })

// ── SPF ───────────────────────────────────────────────────────────────────
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

// ── DMARC ─────────────────────────────────────────────────────────────────
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

// ── Copy ───────────────────────────────────────────────────────────────────
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
    <NavBar />
    <div class="tool-shell">

      <NuxtLink to="/tools" class="back-link">← All Tools</NuxtLink>

      <div class="tool-header">
        <div class="tool-badge" style="color:#fd79a8;background:rgba(253,121,168,0.1)">DNS &amp; Email</div>
        <h1 class="tool-title">SPF / DKIM / DMARC Generator</h1>
        <p class="tool-subtitle">Build valid email authentication DNS records visually. Select your email providers, set policies, and copy the TXT record values.</p>
      </div>

      <div class="sections">

        <!-- ── SPF ───────────────────────────────────────────────── -->
        <div class="record-section">
          <div class="record-header">
            <div>
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
                <span
                  v-for="p in spfProviders"
                  :key="p"
                  class="pchip"
                >
                  {{ p }}
                  <button class="pchip-remove" @click="removeSpfProvider(p)">×</button>
                </span>
              </div>
              <div class="add-row">
                <select v-model="spfNewProvider" class="provider-select">
                  <option value="">Select provider…</option>
                  <option v-for="(_, name) in SPF_PROVIDERS" :key="name" :value="name">{{ name }}</option>
                </select>
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
                <span class="record-output-label">TXT record value</span>
                <button class="copy-btn" @click="copySpf">
                  <svg v-if="!copiedSpf" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copiedSpf ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="record-value">{{ spfRecord }}</pre>
            </div>
          </div>
        </div>

        <!-- ── DMARC ──────────────────────────────────────────────── -->
        <div class="record-section">
          <div class="record-header">
            <div>
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
              <select v-model="dmarcSubPolicy" class="field-input">
                <option value="">Same as p=</option>
                <option value="none">none</option>
                <option value="quarantine">quarantine</option>
                <option value="reject">reject</option>
              </select>
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
                <span class="record-output-label">TXT record value</span>
                <button class="copy-btn" @click="copyDmarc">
                  <svg v-if="!copiedDmarc" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copiedDmarc ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="record-value">{{ dmarcRecord }}</pre>
            </div>
          </div>
        </div>

        <!-- ── DKIM info ───────────────────────────────────────────── -->
        <div class="record-section">
          <div class="record-header">
            <div>
              <h2 class="record-title">DKIM</h2>
              <p class="record-subtitle">DKIM keys are generated by your email provider — we can't create them here.</p>
            </div>
          </div>
          <div class="record-body">
            <div class="dkim-info">
              <p>DKIM requires your provider to generate a public/private key pair. Find setup instructions for your provider:</p>
              <ul class="dkim-list">
                <li>Google Workspace: Admin Console → Gmail → Authenticate email</li>
                <li>Microsoft 365: Security admin center → Email authentication</li>
                <li>Mailchimp: Account → Domains → Authenticate</li>
                <li>SendGrid: Settings → Sender Authentication → Domain Authentication</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ── Pro ────────────────────────────────────────────────── -->
        <div class="pro-section">
          <div class="pro-section-header">
            <span class="pro-label">Check my domain</span>
            <span class="pro-badge">Pro</span>
          </div>
          <ProGate feature="Query live DNS and analyze your current records">
            <div style="padding:20px">
              <p style="font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.2);margin:0">Enter your domain → query live DNS → see your current SPF, DMARC, and DKIM records with analysis and recommendations.</p>
            </div>
          </ProGate>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }
.tool-shell { max-width: 860px; margin: 0 auto; padding: 100px 24px 80px; }

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.3); text-decoration: none;
  margin-bottom: 32px; transition: color 0.15s;
}
.back-link:hover { color: rgba(255,255,255,0.7); }

.tool-header { margin-bottom: 32px; }
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
  color: rgba(255,255,255,0.38); line-height: 1.6; max-width: 560px;
}

/* ── Sections ────────────────────────────────────────────── */
.sections { display: flex; flex-direction: column; gap: 16px; }

.record-section {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}

.record-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04);
  flex-wrap: wrap;
}
.record-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700;
  color: rgba(255,255,255,0.85); margin: 0 0 4px;
}
.record-subtitle {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.3); margin: 0;
}
.record-dns-hint {
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.25); flex-shrink: 0;
}
.record-dns-hint code {
  font-family: monospace; background: rgba(255,255,255,0.06);
  padding: 1px 5px; border-radius: 3px; color: rgba(255,255,255,0.45);
}

.record-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }

/* ── Fields ──────────────────────────────────────────────── */
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
  font-family: 'DM Sans', sans-serif; font-size: 11px;
  color: rgba(255,255,255,0.2); line-height: 1.5; margin: 0;
}
.field-hint code {
  font-family: monospace; background: rgba(255,255,255,0.06);
  padding: 1px 4px; border-radius: 3px; color: rgba(255,255,255,0.4);
}

/* ── Provider chips ──────────────────────────────────────── */
.provider-chips { display: flex; flex-wrap: wrap; gap: 6px; min-height: 24px; }
.pchip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600;
  color: #fd79a8; background: rgba(253,121,168,0.08);
  border: 1px solid rgba(253,121,168,0.2);
  padding: 3px 9px; border-radius: 20px;
}
.pchip-remove {
  background: none; border: none; cursor: pointer; color: inherit;
  opacity: 0.5; font-size: 14px; padding: 0; transition: opacity 0.15s;
}
.pchip-remove:hover { opacity: 1; }

.add-row { display: flex; gap: 8px; }
.provider-select {
  flex: 1; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 6px;
  padding: 7px 10px; font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: rgba(255,255,255,0.6); outline: none; cursor: pointer;
}
.add-btn {
  background: rgba(253,121,168,0.1); border: 1px solid rgba(253,121,168,0.2);
  border-radius: 5px; padding: 7px 14px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #fd79a8; cursor: pointer; transition: background 0.15s;
}
.add-btn:hover { background: rgba(253,121,168,0.18); }

/* ── Policy toggle ───────────────────────────────────────── */
.policy-toggle { display: flex; gap: 6px; flex-wrap: wrap; }
.policy-btn {
  font-family: 'Fira Mono', monospace; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 5px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s;
}
.policy-btn--active { background: rgba(253,121,168,0.1); border-color: rgba(253,121,168,0.3); color: #fd79a8; }
.policy-btn--hard.policy-btn--active { background: rgba(255,71,87,0.1); border-color: rgba(255,71,87,0.3); color: #ff4757; }

/* ── Pct slider ──────────────────────────────────────────── */
.pct-slider { width: 100%; accent-color: #fd79a8; cursor: pointer; }
.pct-val {
  font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700;
  color: #fd79a8;
}

/* ── Record output ───────────────────────────────────────── */
.record-output {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px; overflow: hidden;
}
.record-output-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.record-output-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.2);
}
.record-value {
  font-family: 'Fira Mono', monospace; font-size: 12px;
  color: rgba(255,255,255,0.7); line-height: 1.6;
  padding: 12px 14px; margin: 0; white-space: pre-wrap; word-break: break-all;
}

.copy-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700;
  color: #ec3586; background: rgba(236,53,134,0.08);
  border: 1px solid rgba(236,53,134,0.2);
  border-radius: 4px; padding: 4px 9px; cursor: pointer; transition: background 0.15s;
}
.copy-btn:hover { background: rgba(236,53,134,0.15); }

/* ── DKIM info ───────────────────────────────────────────── */
.dkim-info {
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.4); line-height: 1.6;
}
.dkim-list {
  margin: 10px 0 0 18px; padding: 0;
  display: flex; flex-direction: column; gap: 5px;
}
.dkim-list li { color: rgba(255,255,255,0.3); font-size: 12px; }

/* ── Pro ─────────────────────────────────────────────────── */
.pro-section {
  background: #0f0f14; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
}
.pro-section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.pro-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.25);
}
.pro-badge {
  font-family: 'Space Grotesk', sans-serif; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #ec3586; background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2); padding: 3px 8px; border-radius: 3px;
}
</style>
