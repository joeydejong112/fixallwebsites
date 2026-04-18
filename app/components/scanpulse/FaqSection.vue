<script setup lang="ts">
const router = useRouter()

const openIndex = ref<number | null>(null)
function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

const faqs = [
  { q: 'How fast is a scan?', a: 'Under 12 seconds for most sites. The page loads, 94 checks run in parallel, and the report renders with an animated score ring.' },
  { q: 'Do you store my site\'s content?', a: 'No HTML or screenshots are retained. We store the check results (pass/warn/crit) and the derived scores. Pro users can opt in to 12 months of score history.' },
  { q: 'Can I scan a staging URL behind basic auth?', a: 'Yes — Pro supports basic auth and custom headers per scan. Use the API or the Advanced toggle in the scan input.' },
  { q: 'What\'s included in the Free plan?', a: 'One full scan per URL, all 94 checks, the full pillar breakdown, and a PDF export. Upgrading unlocks unlimited scans, monitoring, bulk, and the 10 fix tools.' },
  { q: 'Is there an API?', a: 'Yes — REST and webhook. Pro gets 1,000 scans/mo via API; Agency is unmetered.' },
]

function handleScan() {
  router.push('/sign-up')
}
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 160px 140px;">
    <div class="grid gap-[80px]" style="grid-template-columns:1fr 1.4fr;">
      <!-- Left: heading + CTA -->
      <div class="flex flex-col justify-center">
        <div class="eyebrow">FAQ</div>
        <h2 class="display" style="font-size:56px;margin:20px 0 16px;">
          Questions.
        </h2>
        <p style="color:var(--text-muted);font-size:16px;line-height:1.6;margin-bottom:28px;">
          Can't find yours? Email <a href="mailto:hi@scanpulse.io" style="color:var(--brand);text-decoration:none;">hi@scanpulse.io</a> — a human replies within a day.
        </p>
        <button class="btn btn-primary self-start" @click="handleScan">
          Scan your site
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Right: accordion -->
      <div class="flex flex-col justify-center">
        <div
          v-for="(f, i) in faqs"
          :key="i"
          style="border-bottom:1px solid var(--border);"
        >
          <!-- Question button -->
          <button
            class="w-full flex items-center justify-between py-6 bg-transparent border-none text-white font-display font-semibold text-left cursor-pointer"
            style="font-size:20px;letter-spacing:-0.02em;"
            @click="toggle(i)"
          >
            <span>{{ f.q }}</span>
            <!-- Plus/minus icon -->
            <span
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
              style="border:1px solid var(--border-strong);"
              :style="openIndex === i ? 'background:rgba(236,53,134,0.2);border-color:rgba(236,53,134,0.4);' : ''"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                class="transition-transform duration-200"
                :style="openIndex === i ? 'transform:rotate(45deg);' : ''"
              >
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </span>
          </button>

          <!-- Answer -->
          <div
            class="overflow-hidden transition-all duration-350"
            style="transition-timing-function:cubic-bezier(0.16,1,0.3,1);"
            :style="openIndex === i ? 'max-height:200px;opacity:1;padding-bottom:24px;' : 'max-height:0;opacity:0;'"
          >
            <p style="font-size:15px;color:var(--text-muted);line-height:1.65;margin:0;max-width:560px;">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>