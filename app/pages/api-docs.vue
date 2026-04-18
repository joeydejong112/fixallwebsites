<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'API Documentation — ScanPulse' })

const BASE = 'https://hip-bass-536.eu-west-1.convex.site'

// ── Try-it state ──────────────────────────────────────────────────────────
const tryKey    = ref('')
const tryUrl    = ref('')
const tryResult = ref('')
const tryStatus = ref<number | null>(null)
const trying    = ref(false)

async function runTry() {
  if (!tryKey.value || !tryUrl.value) return
  trying.value = true
  tryResult.value = ''
  tryStatus.value = null
  try {
    const res = await fetch(`${BASE}/api/v1/scan`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${tryKey.value}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ url: tryUrl.value }),
    })
    tryStatus.value = res.status
    const data = await res.json()
    tryResult.value = JSON.stringify(data, null, 2)
  } catch (e: any) {
    tryResult.value = e?.message ?? 'Request failed'
  } finally {
    trying.value = false
  }
}

// ── Code snippets ────────────────────────────────────────────────────────
const activeTab = ref<'curl' | 'js' | 'python'>('curl')

const SCAN_ID_PLACEHOLDER = '{scanId}'

const snippets = {
  curl: `# Submit a scan
curl -X POST ${BASE}/api/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'

# Poll for results
curl ${BASE}/api/v1/scan/${SCAN_ID_PLACEHOLDER} \\
  -H "Authorization: Bearer YOUR_API_KEY"

# List your scans
curl "${BASE}/api/v1/scans?status=done&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

  js: `const BASE = '${BASE}'
const API_KEY = 'YOUR_API_KEY'

// Submit a scan
const { scanId } = await fetch(\`\${BASE}/api/v1/scan\`, {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: 'https://example.com' }),
}).then(r => r.json())

// Poll until done
let result
while (true) {
  result = await fetch(\`\${BASE}/api/v1/scan/\${scanId}\`, {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
  }).then(r => r.json())
  if (result.status === 'done' || result.status === 'error') break
  await new Promise(r => setTimeout(r, 2000))
}

`,

  python: `import requests, time

BASE = '${BASE}'
API_KEY = 'YOUR_API_KEY'
headers = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

# Submit a scan
r = requests.post(f'{BASE}/api/v1/scan',
    headers=headers, json={'url': 'https://example.com'})
scan_id = r.json()['scanId']

# Poll until done
while True:
    r = requests.get(f'{BASE}/api/v1/scan/{scan_id}', headers=headers)
    result = r.json()
    if result['status'] in ('done', 'error'):
        break
    time.sleep(2)

print('Overall score:', result.get('scores', {}).get('overall'))`,
}

const responseExample = `{
  "scanId": "jd7k2m9p4n8q...",
  "url": "https://example.com",
  "status": "done",
  "scores": {
    "overall": 74,
    "security": 80,
    "performance": 65,
    "seo": 72,
    "accessibility": 90,
    "ai": 60
  },
  "issues": [
    {
      "pillar": "security",
      "severity": "critical",
      "title": "Missing Content-Security-Policy",
      "description": "No CSP header found."
    }
  ],
  "scannedAt": "2026-04-07T10:00:00.000Z"
}`

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/scan',
    description: 'Submit a URL for scanning. Returns immediately with a scanId — poll the GET endpoint for results.',
    request: '{ "url": "https://example.com" }',
    response: '{ "scanId": "...", "status": "pending", "pollUrl": "/api/v1/scan/{scanId}" }',
    status: 201,
  },
  {
    method: 'GET',
    path: '/api/v1/scan/{scanId}',
    description: 'Retrieve scan status and results. Poll every 2–5 seconds until status is done or error.',
    request: null,
    response: responseExample,
    status: 200,
  },
  {
    method: 'GET',
    path: '/api/v1/scans',
    description: 'List your most recent scans. Supports ?status=done|running|error|pending and ?limit=N (max 100).',
    request: null,
    response: '{ "scans": [...], "count": 10 }',
    status: 200,
  },
]

function methodColor(m: string) {
  return m === 'POST' ? '#ec3586' : '#00d4aa'
}

function copySnippet() {
  navigator.clipboard.writeText(snippets[activeTab.value])
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <main class="max-w-4xl mx-auto px-4 py-14">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/settings" class="text-sm text-muted hover:text-white transition-colors mb-4 inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Settings
        </NuxtLink>
        <h1 class="text-3xl font-display font-bold text-white mb-2">API Reference</h1>
        <p class="text-muted max-w-xl">Programmatic access to ScanPulse — from CI pipelines, Slack bots, or custom dashboards. Requires a Pro API key.</p>
      </div>

      <!-- Base URL + auth -->
      <div class="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex-1">
          <div class="text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-1">Base URL</div>
          <code class="text-sm text-white/80 font-mono">{{ BASE }}</code>
        </div>
        <div class="flex-1">
          <div class="text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-1">Authentication</div>
          <code class="text-sm text-white/80 font-mono">Authorization: Bearer YOUR_API_KEY</code>
        </div>
      </div>

      <!-- Endpoint reference -->
      <h2 class="text-lg font-display font-bold text-white mb-4">Endpoints</h2>
      <div class="space-y-4 mb-10">
        <div v-for="ep in ENDPOINTS" :key="ep.path" class="card p-5">
          <!-- Method + path -->
          <div class="flex items-center gap-3 mb-3">
            <span
              class="text-[10px] font-display font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-md"
              :style="{ background: methodColor(ep.method) + '1a', color: methodColor(ep.method) }"
            >{{ ep.method }}</span>
            <code class="text-sm text-white font-mono">{{ ep.path }}</code>
            <span class="ml-auto text-[10px] font-mono text-muted">{{ ep.status }}</span>
          </div>
          <p class="text-sm text-muted mb-3">{{ ep.description }}</p>
          <!-- Request body -->
          <div v-if="ep.request" class="mb-3">
            <div class="text-[9px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-1">Request body</div>
            <pre class="text-xs text-white/70 bg-dark rounded-lg p-3 overflow-x-auto font-mono">{{ ep.request }}</pre>
          </div>
          <!-- Response -->
          <div>
            <div class="text-[9px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-1">Response</div>
            <pre class="text-xs text-white/70 bg-dark rounded-lg p-3 overflow-x-auto font-mono">{{ ep.response }}</pre>
          </div>
        </div>
      </div>

      <!-- Code snippets -->
      <h2 class="text-lg font-display font-bold text-white mb-4">Code Examples</h2>
      <div class="card overflow-hidden mb-10">
        <!-- Tab bar -->
        <div class="flex items-center gap-0 border-b border-dark-border px-4">
          <button
            v-for="tab in (['curl', 'js', 'python'] as const)"
            :key="tab"
            class="px-4 py-3 text-xs font-display font-semibold tracking-[0.1em] uppercase transition-colors border-b-2 -mb-px"
            :class="activeTab === tab
              ? 'text-primary border-primary'
              : 'text-muted border-transparent hover:text-white/70'"
            @click="activeTab = tab"
          >{{ tab === 'js' ? 'JavaScript' : tab === 'curl' ? 'cURL' : 'Python' }}</button>
          <button
            class="ml-auto flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors py-3"
            @click="copySnippet"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Copy
          </button>
        </div>
        <pre class="text-xs text-white/75 p-5 overflow-x-auto font-mono leading-relaxed">{{ snippets[activeTab] }}</pre>
      </div>

      <!-- Try it -->
      <h2 class="text-lg font-display font-bold text-white mb-4">Try it</h2>
      <div class="card p-6 mb-10">
        <div class="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label class="block text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-2">API Key</label>
            <input v-model="tryKey" type="password" placeholder="sp_live_..." class="input-field w-full text-sm" />
          </div>
          <div>
            <label class="block text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted mb-2">URL to scan</label>
            <input v-model="tryUrl" type="url" placeholder="https://example.com" class="input-field w-full text-sm" />
          </div>
        </div>
        <button
          class="btn-primary text-sm flex items-center gap-2"
          :disabled="trying || !tryKey || !tryUrl"
          @click="runTry"
        >
          <svg v-if="trying" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {{ trying ? 'Sending…' : 'Send POST /api/v1/scan' }}
        </button>

        <div v-if="tryResult" class="mt-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-display font-bold tracking-[0.14em] uppercase text-muted">Response</span>
            <span
              class="text-[9px] font-mono px-1.5 py-0.5 rounded"
              :class="tryStatus && tryStatus < 300 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
            >{{ tryStatus }}</span>
          </div>
          <pre class="text-xs text-white/75 bg-dark rounded-lg p-4 overflow-x-auto font-mono">{{ tryResult }}</pre>
        </div>
      </div>

      <!-- Error codes -->
      <h2 class="text-lg font-display font-bold text-white mb-4">Error Codes</h2>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-dark-border">
              <th class="text-left px-5 py-3 text-xs text-muted font-medium">Status</th>
              <th class="text-left px-4 py-3 text-xs text-muted font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[code, msg] in [[401,'Missing or invalid API key'],[403,'Key owner does not match resource'],[422,'Invalid or missing URL in request body'],[429,'Rate limit exceeded — retry after 60 seconds'],[500,'Internal server error']]" :key="code" class="border-b border-dark-border last:border-0">
              <td class="px-5 py-3 font-mono text-danger text-sm">{{ code }}</td>
              <td class="px-4 py-3 text-muted text-sm">{{ msg }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
