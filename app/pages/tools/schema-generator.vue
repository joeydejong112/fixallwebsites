<script setup lang="ts">
definePageMeta({ layout: 'tool' })
useSeoMeta({
  title: 'Free Schema Markup Generator — JSON-LD Structured Data',
  description: 'Generate valid JSON-LD structured data for Article, BlogPosting, and Organization with a guided form. Copy the script block or download as .json — free.',
  ogTitle: 'Free JSON-LD Schema Markup Generator',
  ogDescription: 'Create Article, BlogPosting, and Organization structured data with a guided form. Copy or download the JSON-LD.',
})
const _siteUrl = useRequestURL()
useHead({ link: [{ rel: 'canonical', href: _siteUrl.origin + _siteUrl.pathname }] })

type SchemaType = 'Article' | 'BlogPosting' | 'Organization'

const schemaType = ref<SchemaType>('Article')

const article = reactive({
  headline:       '',
  url:            '',
  description:    '',
  authorName:     '',
  authorUrl:      '',
  publisherName:  '',
  publisherLogo:  '',
  datePublished:  '',
  dateModified:   '',
  image:          '',
})

const org = reactive({
  name:      '',
  url:       '',
  logo:      '',
  email:     '',
  phone:     '',
  sameAs:    '',
})

const jsonLd = computed(() => {
  if (schemaType.value === 'Organization') {
    const obj: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
    }
    if (org.name)   obj.name   = org.name
    if (org.url)    obj.url    = org.url
    if (org.logo)   obj.logo   = { '@type': 'ImageObject', url: org.logo }
    if (org.email)  obj.email  = org.email
    if (org.phone)  obj.telephone = org.phone
    if (org.sameAs) obj.sameAs = org.sameAs.split('\n').map(s => s.trim()).filter(Boolean)
    return JSON.stringify(obj, null, 2)
  }

  const obj: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType.value,
  }
  if (article.headline)      obj.headline     = article.headline
  if (article.url)           obj.url          = article.url
  if (article.description)   obj.description  = article.description
  if (article.image)         obj.image        = article.image
  if (article.datePublished) obj.datePublished = article.datePublished
  if (article.dateModified)  obj.dateModified  = article.dateModified
  if (article.authorName) {
    obj.author = { '@type': 'Person', name: article.authorName }
    if (article.authorUrl) obj.author.url = article.authorUrl
  }
  if (article.publisherName) {
    obj.publisher = { '@type': 'Organization', name: article.publisherName }
    if (article.publisherLogo) obj.publisher.logo = { '@type': 'ImageObject', url: article.publisherLogo }
  }
  return JSON.stringify(obj, null, 2)
})

const scriptBlock = computed(() => `<script type="application/ld+json">\n${jsonLd.value}\n<\/script>`)

const copiedScript = ref(false)
async function copyScript() {
  await navigator.clipboard.writeText(scriptBlock.value)
  copiedScript.value = true
  setTimeout(() => copiedScript.value = false, 2000)
}

function downloadJson() {
  const blob = new Blob([jsonLd.value], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'schema.json'
  a.click()
}
</script>

<template>
  <div class="page-bg">
    <div class="tool-shell">

      <!-- Header -->
      <div class="tool-header">
        <div class="tool-badge">SEO</div>
        <h1 class="tool-title">Schema Markup Generator</h1>
        <p class="tool-subtitle">Generate valid JSON-LD structured data to help search engines understand your content. Fill in the form and copy the ready-to-paste <code>&lt;script&gt;</code> block.</p>
      </div>

      <!-- Type selector -->
      <div class="type-selector">
        <button
          v-for="t in (['Article', 'BlogPosting', 'Organization'] as SchemaType[])"
          :key="t"
          class="type-btn"
          :class="{ 'type-btn--active': schemaType === t }"
          @click="schemaType = t"
        >{{ t }}</button>
        <div class="pro-types">
          <span class="pro-type-chip">LocalBusiness</span>
          <span class="pro-type-chip">Product</span>
          <span class="pro-type-chip">FAQPage</span>
          <span class="pro-badge-sm">Pro</span>
        </div>
      </div>

      <div class="tool-columns">

        <!-- Form -->
        <div class="form-card">

          <!-- Article / BlogPosting -->
          <template v-if="schemaType !== 'Organization'">
            <div class="field">
              <label class="field-label">Headline *</label>
              <input v-model="article.headline" class="field-input" type="text" placeholder="The article title" />
            </div>
            <div class="field">
              <label class="field-label">Page URL</label>
              <input v-model="article.url" class="field-input" type="url" placeholder="https://yoursite.com/article" />
            </div>
            <div class="field">
              <label class="field-label">Description</label>
              <textarea v-model="article.description" class="field-input field-textarea" rows="2" placeholder="Brief summary of the article" />
            </div>
            <div class="field">
              <label class="field-label">Featured image URL</label>
              <input v-model="article.image" class="field-input" type="url" placeholder="https://yoursite.com/og-image.jpg" />
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Date published</label>
                <input v-model="article.datePublished" class="field-input" type="date" />
              </div>
              <div class="field">
                <label class="field-label">Date modified</label>
                <input v-model="article.dateModified" class="field-input" type="date" />
              </div>
            </div>
            <div class="section-divider">Author</div>
            <div class="field">
              <label class="field-label">Author name</label>
              <input v-model="article.authorName" class="field-input" type="text" placeholder="Jane Smith" />
            </div>
            <div class="field">
              <label class="field-label">Author URL</label>
              <input v-model="article.authorUrl" class="field-input" type="url" placeholder="https://yoursite.com/about" />
            </div>
            <div class="section-divider">Publisher</div>
            <div class="field">
              <label class="field-label">Publisher name</label>
              <input v-model="article.publisherName" class="field-input" type="text" placeholder="Your Brand" />
            </div>
            <div class="field">
              <label class="field-label">Publisher logo URL</label>
              <input v-model="article.publisherLogo" class="field-input" type="url" placeholder="https://yoursite.com/logo.png" />
            </div>
          </template>

          <!-- Organization -->
          <template v-else>
            <div class="field">
              <label class="field-label">Organization name *</label>
              <input v-model="org.name" class="field-input" type="text" placeholder="Acme Corp" />
            </div>
            <div class="field">
              <label class="field-label">Website URL</label>
              <input v-model="org.url" class="field-input" type="url" placeholder="https://yoursite.com" />
            </div>
            <div class="field">
              <label class="field-label">Logo URL</label>
              <input v-model="org.logo" class="field-input" type="url" placeholder="https://yoursite.com/logo.png" />
            </div>
            <div class="field">
              <label class="field-label">Email</label>
              <input v-model="org.email" class="field-input" type="email" placeholder="hello@yoursite.com" />
            </div>
            <div class="field">
              <label class="field-label">Phone</label>
              <input v-model="org.phone" class="field-input" type="tel" placeholder="+1 555 000 0000" />
            </div>
            <div class="field">
              <label class="field-label">Social profiles (one per line)</label>
              <textarea v-model="org.sameAs" class="field-input field-textarea" rows="4" placeholder="https://twitter.com/yourorg&#10;https://linkedin.com/company/yourorg" />
            </div>
          </template>
        </div>

        <!-- Output -->
        <div class="output-col">

          <!-- JSON-LD output -->
          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot" />
                <p class="output-label">JSON-LD Output</p>
              </div>
              <div class="output-actions">
                <button class="copy-btn" @click="copyScript">
                  <svg v-if="!copiedScript" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  {{ copiedScript ? 'Copied!' : 'Copy &lt;script&gt;' }}
                </button>
                <button class="dl-btn" @click="downloadJson">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  .json
                </button>
              </div>
            </div>
            <pre class="output-code">{{ scriptBlock }}</pre>
          </div>

          <!-- Pro: Validation -->
          <div class="output-card">
            <div class="output-header">
              <div class="output-title-row">
                <span class="output-dot" />
                <p class="output-label">Validation &amp; rich results preview</p>
              </div>
              <span class="pro-badge">Pro</span>
            </div>
            <ProGate feature="Validate against Schema.org & preview rich results">
              <div class="pro-placeholder">
                <p>Validate required fields, check for errors, and see a mock Google Rich Results preview card.</p>
              </div>
            </ProGate>
          </div>

        </div>
      </div>
      <ToolSeoSection />
    </div>
  </div>
</template>

<style scoped>
.page-bg { min-height: 100vh; background: #07070a; }

.tool-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 28px 80px;
}

.tool-header { margin-bottom: 24px; }

.tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6c5ce7;
  background: rgba(108, 92, 231, 0.1);
  border: 1px solid rgba(108, 92, 231, 0.2);
  padding: 4px 10px;
  border-radius: 3px;
  margin-bottom: 12px;
}

.tool-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
  color: white;
  letter-spacing: -0.03em;
  margin-bottom: 10px;
}

.tool-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: rgba(255,255,255,0.60);
  line-height: 1.6;
  max-width: 580px;
}

.tool-subtitle code {
  font-family: monospace;
  font-size: 13px;
  background: rgba(255,255,255,0.07);
  padding: 1px 5px;
  border-radius: 3px;
  color: rgba(255,255,255,0.55);
}

/* ── Type selector ───────────────────────────────────────── */
.type-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.type-btn {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 16px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.02em;
}

.type-btn:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}

.type-btn--active {
  background: rgba(108,92,231,0.14);
  border-color: rgba(108,92,231,0.35);
  color: #a29bfe;
}

.pro-types {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 4px;
}

.pro-type-chip {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 5px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.35);
  cursor: default;
}

.pro-badge-sm {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ec3586;
  background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2);
  padding: 3px 7px;
  border-radius: 3px;
}

/* ── Columns ─────────────────────────────────────────────── */
.tool-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .tool-columns { grid-template-columns: 1fr; }
  .output-col { position: static; max-height: none; }
}

/* ── Form ────────────────────────────────────────────────── */
.form-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }

.field-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
}

.field-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.field-input:focus { border-color: rgba(108,92,231,0.4); }
.field-input::placeholder { color: rgba(255,255,255,0.15); }
.field-textarea { resize: vertical; min-height: 64px; }

.section-divider {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.50);
  padding: 6px 10px;
  border-left: 2px solid #6c5ce7;
  background: rgba(108,92,231,0.05);
  border-radius: 0 4px 4px 0;
}

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

/* ── Output title row ────────────────────────────────────── */
.output-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.output-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6c5ce7;
  flex-shrink: 0;
}

/* ── Output card ─────────────────────────────────────────── */
.output-card {
  background: #0c0c12;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.output-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  margin: 0;
}

.output-actions { display: flex; gap: 6px; }

.output-code {
  font-family: 'Fira Mono', monospace;
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  line-height: 1.8;
  padding: 16px 18px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── Buttons ─────────────────────────────────────────────── */
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6c5ce7;
  background: rgba(108,92,231,0.08);
  border: 1px solid rgba(108,92,231,0.2);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.copy-btn:hover { background: rgba(108,92,231,0.16); }

.dl-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6c5ce7;
  background: transparent;
  border: 1px solid rgba(108,92,231,0.3);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.dl-btn:hover { background: rgba(108,92,231,0.1); }

/* ── Pro ─────────────────────────────────────────────────── */
.pro-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ec3586;
  background: rgba(236,53,134,0.1);
  border: 1px solid rgba(236,53,134,0.2);
  padding: 3px 8px;
  border-radius: 3px;
}

.pro-placeholder {
  padding: 20px;
}
.pro-placeholder p {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.50);
  margin: 0;
}
</style>
