<script setup lang="ts">
const router = useRouter()

const billingPeriod = ref<'monthly' | 'annual'>('monthly')

const tiers = [
  {
    name: 'Free',
    price: '$0',
    per: '',
    tag: 'Always free',
    blurb: 'Kick the tires. One full scan per URL. No credit card.',
    features: ['1 scan per URL', 'All 94 checks', 'Full pillar breakdown', 'Export as PDF'],
    cta: 'Start scanning',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$15',
    per: '/ month',
    tag: 'Most teams',
    blurb: 'Unlimited scans, all 10 fix tools, monitoring, bulk, API.',
    features: ['Unlimited scans', 'All 10 fix tools', '24h monitoring + alerts', 'Bulk scan up to 500 URLs', 'Full API access', 'Score history, 12mo'],
    cta: 'Start 14-day trial',
    primary: true,
  },
  {
    name: 'Agency',
    price: '$59',
    per: '/ month',
    tag: 'Consultants & studios',
    blurb: 'Everything in Pro, plus white-label reports and 25 seats.',
    features: ['Everything in Pro', 'White-label PDF reports', '25 team seats', 'Priority support', 'SSO + SAML', 'Audit log'],
    cta: 'Talk to us',
    primary: false,
  },
]

const displayedTiers = computed(() =>
  billingPeriod.value === 'annual'
    ? tiers.map(t => {
        if (t.price === '$0') return t
        const monthly = parseFloat(t.price.replace('$', ''))
        const discounted = (monthly * 0.9).toFixed(2).replace('.00', '')
        return { ...t, price: `$${discounted}`, per: '/ mo · billed annually' }
      })
    : tiers
)

function handleScan() {
  router.push('/sign-up')
}
</script>

<template>
  <section class="relative grid-bg" style="padding:120px 80px 120px 140px;">
    <!-- Header -->
    <div style="max-width:720px;margin-bottom:60px;">
      <div class="eyebrow">Pricing</div>
      <h2 class="display" style="font-size:64px;margin:20px 0 16px;">
        One plan does it.
      </h2>
      <p style="font-size:17px;color:var(--text-muted);max-width:560px;line-height:1.6;">
        Free for a single scan. Fifteen dollars unlocks everything — tools, monitoring, bulk, API.
      </p>
    </div>

    <!-- Billing toggle -->
    <div
      class="flex items-center rounded-full border overflow-hidden mb-10"
      style="border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);width:fit-content;"
    >
      <button
        class="px-4 py-2 font-display font-semibold uppercase tracking-[0.14em] text-[11px] transition-colors"
        :class="billingPeriod === 'monthly' ? 'text-white bg-white/10' : 'text-white/40'"
        @click="billingPeriod = 'monthly'"
      >Monthly</button>
      <button
        class="flex items-center gap-2 px-4 py-2 font-display font-semibold uppercase tracking-[0.14em] text-[11px] transition-colors"
        :class="billingPeriod === 'annual' ? 'text-white bg-white/10' : 'text-white/40'"
        @click="billingPeriod = 'annual'"
      >
        Annual
        <span
          class="text-[9px] font-bold tracking-[0.06em] px-1.5 py-0.5 rounded-full"
          style="background:rgba(0,212,170,0.15);color:#00d4aa;"
        >−10%</span>
      </button>
    </div>

    <!-- Tier cards -->
    <div class="grid gap-5" style="grid-template-columns:repeat(3,1fr);align-items:stretch;">
      <div
        v-for="t in displayedTiers"
        :key="t.name"
        class="card lift relative flex flex-col"
        style="padding:30px 28px;"
        :style="t.primary
          ? 'border:1px solid rgba(236,53,134,0.35);background:linear-gradient(180deg,rgba(236,53,134,0.06),transparent 60%),var(--elevated);box-shadow:0 0 60px rgba(236,53,134,0.12);'
          : 'border:1px solid var(--border);'"
      >
        <!-- Top accent -->
        <div
          v-if="t.primary"
          class="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style="background:var(--brand);"
        />

        <!-- Name + tag -->
        <div class="flex items-center justify-between mb-[18px]">
          <span class="font-display font-semibold text-white" style="font-size:14px;">{{ t.name }}</span>
          <span
            class="chip"
            style="border-color: t.primary ? 'rgba(236,53,134,0.3)' : 'var(--border);background: t.primary ? 'var(--brand-soft)' : 'rgba(255,255,255,0.03)';color: t.primary ? 'var(--brand)' : 'var(--text-muted)';"
          >{{ t.tag }}</span>
        </div>

        <!-- Price -->
        <div class="flex items-baseline gap-[6px] mb-[10px]">
          <span class="num" style="font-size:56px;">{{ t.price }}</span>
          <span v-if="t.per" style="color:var(--text-muted);font-size:15px;">{{ t.per }}</span>
        </div>

        <!-- Blurb -->
        <p style="font-size:14px;color:var(--text-muted);line-height:1.5;margin:0 0 24px;">{{ t.blurb }}</p>

        <!-- CTA -->
        <button
          class="w-full flex items-center justify-center font-display font-semibold rounded-[9px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-[24px]"
          style="height:42px;"
          :class="t.primary ? 'btn btn-primary' : 'btn btn-ghost'"
          @click="handleScan"
        >
          {{ t.cta }}
          <svg v-if="t.primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ml-2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        <!-- Feature list -->
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
          <li
            v-for="f in t.features"
            :key="f"
            class="flex items-center gap-[10px]"
            style="font-size:13px;color:rgba(255,255,255,0.72);"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12l5 5L20 7"/>
            </svg>
            {{ f }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>