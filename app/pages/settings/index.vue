<script setup lang="ts">
import { useAppToast } from '~/composables/useAppToast'
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Settings — ScanPulse' })

type Tab = 'profile' | 'billing' | 'notifications' | 'developer' | 'danger'

const activeTab = ref<Tab>('profile')

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: 'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z' },
  { id: 'billing',       label: 'Billing',       icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
  { id: 'notifications', label: 'Notifications', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  { id: 'developer',    label: 'Developer',     icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
  { id: 'danger',       label: 'Danger Zone',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
]

// ── Shared data ───────────────────────────────────────────
const { userId } = useAuth()
const { user }   = useUser()
const { client, api } = useConvex()
const clerkAppearance = useClerkAppearance()
const { toast } = useAppToast()

const convexUser = ref<{ plan: 'free' | 'pro'; scanCount: number; alertPreferences: { enabled: boolean; threshold: number; email?: string } | null } | null>(null)
const monitors   = ref<any[]>([])

watchEffect(async () => {
  if (!userId.value) return
  const [userResult, monitorsResult] = await Promise.allSettled([
    client.query(api.users.getUserByClerkId, { clerkId: userId.value }),
    client.query(api.monitors.getMonitors, { userId: userId.value }),
  ])
  if (userResult.status === 'fulfilled')     convexUser.value = userResult.value
  if (monitorsResult.status === 'fulfilled') monitors.value   = monitorsResult.value

  // Seed notification form from saved prefs
  const prefs = convexUser.value?.alertPreferences
  if (prefs) {
    alertEnabled.value   = prefs.enabled
    alertThreshold.value = prefs.threshold
    alertEmail.value     = prefs.email ?? ''
  }
})

const displayName  = computed(() => user.value?.fullName || user.value?.firstName || 'User')
const displayEmail = computed(() => user.value?.primaryEmailAddress?.emailAddress || '')
const plan         = computed(() => convexUser.value?.plan ?? 'free')

// ── Billing tab ───────────────────────────────────────────
const FREE_SCAN_LIMIT = 1
const billingLoading  = ref(false)

const scanCount       = computed(() => convexUser.value?.scanCount ?? 0)
const scansRemaining  = computed(() => plan.value === 'pro' ? Infinity : Math.max(0, FREE_SCAN_LIMIT - scanCount.value))
const scanPct         = computed(() => plan.value === 'pro' ? 100 : Math.min(100, (scanCount.value / FREE_SCAN_LIMIT) * 100))
const monitorCount    = computed(() => monitors.value.length)

// ── Notifications tab ─────────────────────────────────────
const alertEnabled   = ref(false)
const alertThreshold = ref(70)
const alertEmail     = ref('')
const notifSaving    = ref(false)

async function saveAlertPreferences() {
  if (!userId.value) return
  notifSaving.value = true
  try {
    await client.mutation(api.users.updateAlertPreferences, {
      clerkId:   userId.value,
      enabled:   alertEnabled.value,
      threshold: alertThreshold.value,
      ...(alertEmail.value.trim() ? { email: alertEmail.value.trim() } : {}),
    })
    toast.success('Notification preferences saved.')
  } catch {
    toast.error('Failed to save preferences. Please try again.')
  } finally {
    notifSaving.value = false
  }
}

// ── Developer tab ─────────────────────────────────────────
const apiKeyList       = ref<any[]>([])
const apiKeyGenerating = ref(false)
const newRawKey        = ref('')
const keyCopied        = ref(false)

async function loadApiKeys() {
  if (!userId.value) return
  try { apiKeyList.value = await client.query(api.apiKeys.listApiKeys, { clerkId: userId.value }) } catch { /* ignore */ }
}

watch(activeTab, (tab) => { if (tab === 'developer') loadApiKeys() })

async function generateKey() {
  if (!userId.value) return
  apiKeyGenerating.value = true
  newRawKey.value = ''
  try {
    newRawKey.value = await client.mutation(api.apiKeys.generateApiKey, { clerkId: userId.value })
    await loadApiKeys()
  } catch (e: any) {
    toast.error(e?.message ?? 'Failed to generate key.')
  } finally {
    apiKeyGenerating.value = false
  }
}

async function revokeKey(keyId: string) {
  if (!userId.value) return
  try {
    await client.mutation(api.apiKeys.revokeApiKey, { clerkId: userId.value, keyId: keyId as any })
    if (newRawKey.value) newRawKey.value = ''
    await loadApiKeys()
    toast.success('API key revoked.')
  } catch {
    toast.error('Failed to revoke key.')
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(newRawKey.value)
  keyCopied.value = true
  setTimeout(() => { keyCopied.value = false }, 2000)
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function handleBillingAction() {
  if (!userId.value) return
  billingLoading.value = true
  try {
    const action = plan.value === 'pro' ? api.stripe.portal : api.stripe.pay
    const url = await client.action(action as any, { clerkId: userId.value })
    window.location.href = url
  } catch {
    toast.error('Failed to connect to billing portal. Please try again.')
  } finally {
    billingLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <!-- Grid bg -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px"
    />

    <!-- Page grid -->
    <div class="relative z-10 max-w-[1100px] mx-auto px-6 md:px-10 xl:px-0 pt-28 pb-20 flex gap-8 md:gap-12 items-start">

      <!-- ── Sidebar (desktop) / Horizontal tabs (mobile) ── -->
      <aside class="shrink-0 w-full md:w-[220px]">

        <!-- Header -->
        <div class="hidden md:block mb-8">
          <NuxtLink to="/dashboard" class="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <p class="font-display font-bold text-white tracking-[-0.03em] mt-4" style="font-size:1.35rem">Settings</p>
          <p class="font-body text-white/30 text-[13px] mt-1">Manage your account</p>
        </div>

        <!-- Nav list (desktop vertical) -->
        <nav class="hidden md:flex flex-col gap-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="sidebar-tab"
            :class="{ 'sidebar-tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 opacity-60" :class="{ 'opacity-100': activeTab === tab.id }">
              <path :d="tab.icon" />
            </svg>
            <span>{{ tab.label }}</span>
          </button>
        </nav>

        <!-- Nav list (mobile horizontal) -->
        <nav class="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="mobile-tab"
            :class="{ 'mobile-tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </aside>

      <!-- ── Content panel ── -->
      <main class="flex-1 min-w-0">

        <!-- Mobile heading -->
        <div class="md:hidden mb-6">
          <NuxtLink to="/dashboard" class="back-link mb-4 inline-flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <p class="font-display font-bold text-white tracking-[-0.03em]" style="font-size:1.35rem">Settings</p>
        </div>

        <!-- Profile tab -->
        <section v-if="activeTab === 'profile'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>PROFILE</span>
            </div>
            <h2 class="settings-heading">Your profile</h2>
            <p class="settings-subtext">Manage your name, email, password, and profile picture.</p>

            <!-- User identity header -->
            <div class="mt-8 mb-6 flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-dark-surface">
              <!-- Avatar -->
              <div class="relative shrink-0">
                <img
                  v-if="user?.imageUrl"
                  :src="user.imageUrl"
                  :alt="displayName"
                  class="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
                />
                <div
                  v-else
                  class="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-white/10"
                >
                  <span class="font-display font-bold text-primary text-xl">
                    {{ displayName.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              <!-- Name + email -->
              <div class="flex-1 min-w-0">
                <div class="font-display font-semibold text-white text-[15px] truncate">{{ displayName }}</div>
                <div class="font-body text-white/40 text-[13px] truncate mt-0.5">{{ displayEmail }}</div>
              </div>
              <!-- Plan badge -->
              <div
                class="shrink-0 px-3 py-1 rounded-full font-display font-semibold text-[11px] tracking-[0.1em] uppercase"
                :class="plan === 'pro'
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'bg-white/[0.05] text-white/40 border border-white/[0.08]'"
              >
                {{ plan === 'pro' ? 'Pro' : 'Free' }}
              </div>
            </div>

            <!-- Clerk UserProfile component -->
            <div class="clerk-profile-wrapper">
              <UserProfile :appearance="clerkAppearance" />
            </div>
          </div>
        </section>

        <!-- Billing tab -->
        <section v-else-if="activeTab === 'billing'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>BILLING</span>
            </div>
            <h2 class="settings-heading">Billing &amp; Usage</h2>
            <p class="settings-subtext">Manage your plan, usage, and subscription.</p>

            <!-- Plan card -->
            <div class="mt-8 p-6 rounded-2xl border bg-dark-surface flex items-center justify-between gap-6"
              :class="plan === 'pro' ? 'border-primary/25' : 'border-white/[0.06]'">
              <div>
                <div class="font-body text-white/40 text-[12px] uppercase tracking-[0.14em] mb-1">Current plan</div>
                <div class="flex items-center gap-3">
                  <span class="font-display font-bold text-white text-2xl">{{ plan === 'pro' ? 'Pro' : 'Hobby' }}</span>
                  <span
                    class="px-2.5 py-0.5 rounded-full font-display font-semibold text-[11px] tracking-[0.1em] uppercase"
                    :class="plan === 'pro'
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-white/[0.05] text-white/40 border border-white/[0.08]'"
                  >{{ plan === 'pro' ? 'Pro' : 'Free' }}</span>
                </div>
                <div class="font-body text-white/30 text-[13px] mt-1">
                  {{ plan === 'pro' ? 'Unlimited scans · Monitoring · API access · PDF reports' : '1 scan · Basic report' }}
                </div>
              </div>
              <button
                class="shrink-0 billing-btn"
                :class="plan === 'pro' ? 'billing-btn--secondary' : 'billing-btn--primary'"
                :disabled="billingLoading"
                @click="handleBillingAction"
              >
                <span v-if="billingLoading">Loading…</span>
                <span v-else-if="plan === 'pro'">Manage subscription</span>
                <span v-else>Upgrade to Pro →</span>
              </button>
            </div>

            <!-- Usage stats -->
            <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">

              <!-- Scans used -->
              <div class="usage-card">
                <div class="usage-label">Scans used</div>
                <div class="usage-value">
                  <span class="text-white">{{ scanCount }}</span>
                  <span class="text-white/30 text-base font-normal">
                    / {{ plan === 'pro' ? '∞' : FREE_SCAN_LIMIT }}
                  </span>
                </div>
                <div class="usage-bar-track">
                  <div
                    class="usage-bar-fill"
                    :style="{ width: scanPct + '%', background: plan === 'pro' ? '#00d4aa' : (scanPct >= 100 ? '#ff4757' : '#ec3586') }"
                  />
                </div>
                <div class="usage-sub">
                  {{ plan === 'pro' ? 'Unlimited' : (scansRemaining > 0 ? `${scansRemaining} remaining` : 'Limit reached') }}
                </div>
              </div>

              <!-- Monitored sites -->
              <div class="usage-card">
                <div class="usage-label">Monitored sites</div>
                <div class="usage-value">
                  <span class="text-white">{{ monitorCount }}</span>
                  <span class="text-white/30 text-base font-normal">/ {{ plan === 'pro' ? '∞' : '0' }}</span>
                </div>
                <div class="usage-bar-track">
                  <div
                    class="usage-bar-fill"
                    :style="{ width: plan === 'pro' ? '40%' : '0%', background: '#ffaa00' }"
                  />
                </div>
                <div class="usage-sub">{{ plan === 'pro' ? 'Active monitoring' : 'Pro feature' }}</div>
              </div>

              <!-- API access -->
              <div class="usage-card">
                <div class="usage-label">API access</div>
                <div class="usage-value">
                  <span :class="plan === 'pro' ? 'text-white' : 'text-white/30'">
                    {{ plan === 'pro' ? 'Enabled' : 'Locked' }}
                  </span>
                </div>
                <div class="usage-bar-track">
                  <div
                    class="usage-bar-fill"
                    :style="{ width: plan === 'pro' ? '100%' : '0%', background: '#6c5ce7' }"
                  />
                </div>
                <div class="usage-sub">{{ plan === 'pro' ? 'REST API + keys' : 'Pro feature' }}</div>
              </div>

            </div>

            <!-- Pro upgrade CTA (free only) -->
            <div v-if="plan !== 'pro'" class="mt-6 p-5 rounded-2xl border border-primary/15 bg-primary/[0.04] flex items-center justify-between gap-4">
              <div>
                <div class="font-display font-semibold text-white text-[15px]">Unlock everything with Pro</div>
                <div class="font-body text-white/40 text-[13px] mt-0.5">Unlimited scans, monitoring, PDF reports, and API access.</div>
              </div>
              <button class="billing-btn billing-btn--primary shrink-0" :disabled="billingLoading" @click="handleBillingAction">
                <span v-if="billingLoading">Loading…</span>
                <span v-else>Upgrade →</span>
              </button>
            </div>

            <!-- Manage sub link (pro only) -->
            <div v-if="plan === 'pro'" class="mt-6 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              <button class="font-body text-white/30 hover:text-white/60 text-[13px] transition-colors" @click="handleBillingAction">
                View invoices &amp; manage subscription in Stripe portal
              </button>
            </div>

          </div>
        </section>

        <!-- Notifications tab -->
        <section v-else-if="activeTab === 'notifications'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>NOTIFICATIONS</span>
            </div>
            <h2 class="settings-heading">Email alerts</h2>
            <p class="settings-subtext">Get notified when your site's score drops below a threshold.</p>

            <!-- Pro lock overlay -->
            <div v-if="plan !== 'pro'" class="mt-8 relative">
              <div class="pointer-events-none opacity-30 select-none" aria-hidden="true">
                <div class="notif-card">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-display font-semibold text-white text-[15px]">Enable email alerts</div>
                      <div class="font-body text-white/40 text-[13px] mt-0.5">Send an email when overall score drops below your threshold</div>
                    </div>
                    <div class="toggle toggle--off" />
                  </div>
                </div>
              </div>
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-dark/60 backdrop-blur-sm border border-white/[0.06]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <div class="text-center">
                  <div class="font-display font-semibold text-white/70 text-[15px]">Pro only</div>
                  <div class="font-body text-white/35 text-[13px] mt-1">Upgrade to Pro to enable email alerts</div>
                </div>
                <button class="billing-btn billing-btn--primary" @click="activeTab = 'billing'">Upgrade to Pro →</button>
              </div>
            </div>

            <!-- Notifications form (Pro) -->
            <div v-else class="mt-8 space-y-5">

              <!-- Enable toggle -->
              <div class="notif-card">
                <div class="flex items-center justify-between gap-6">
                  <div>
                    <div class="font-display font-semibold text-white text-[15px]">Enable email alerts</div>
                    <div class="font-body text-white/40 text-[13px] mt-0.5">Send an email when your site's overall score drops below the threshold</div>
                  </div>
                  <button
                    class="toggle shrink-0"
                    :class="alertEnabled ? 'toggle--on' : 'toggle--off'"
                    role="switch"
                    :aria-checked="alertEnabled"
                    @click="alertEnabled = !alertEnabled"
                  />
                </div>
              </div>

              <!-- Threshold slider -->
              <div class="notif-card" :class="{ 'opacity-40 pointer-events-none': !alertEnabled }">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-display font-semibold text-white text-[15px]">Score threshold</div>
                  <div class="font-display font-bold text-primary text-xl">{{ alertThreshold }}</div>
                </div>
                <p class="font-body text-white/40 text-[13px] mb-5">
                  Alert me when overall score drops below <strong class="text-white/70">{{ alertThreshold }}</strong>
                </p>
                <div class="relative">
                  <input
                    v-model.number="alertThreshold"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    class="alert-slider"
                  />
                  <div class="flex justify-between mt-2">
                    <span class="font-body text-white/20 text-[11px]">0</span>
                    <span class="font-body text-white/20 text-[11px]">50</span>
                    <span class="font-body text-white/20 text-[11px]">100</span>
                  </div>
                </div>
              </div>

              <!-- Email override -->
              <div class="notif-card" :class="{ 'opacity-40 pointer-events-none': !alertEnabled }">
                <label class="block font-display font-semibold text-white text-[15px] mb-1">Alert email</label>
                <p class="font-body text-white/40 text-[13px] mb-4">Leave blank to use your Clerk account email ({{ displayEmail }})</p>
                <input
                  v-model="alertEmail"
                  type="email"
                  placeholder="override@example.com"
                  class="w-full bg-dark border border-white/[0.08] text-white placeholder-white/20 rounded-xl px-4 py-3 font-body text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <!-- Save button -->
              <div class="flex justify-end">
                <button
                  class="billing-btn billing-btn--primary"
                  :disabled="notifSaving"
                  @click="saveAlertPreferences"
                >
                  {{ notifSaving ? 'Saving…' : 'Save preferences' }}
                </button>
              </div>

            </div>
          </div>
        </section>

        <!-- Developer tab -->
        <section v-else-if="activeTab === 'developer'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>DEVELOPER</span>
            </div>
            <h2 class="settings-heading">API access</h2>
            <p class="settings-subtext">Generate API keys to run scans and fetch results programmatically.</p>

            <!-- Pro lock -->
            <div v-if="plan !== 'pro'" class="mt-8 relative">
              <div class="pointer-events-none opacity-25 select-none" aria-hidden="true">
                <div class="notif-card font-body text-white/40 text-sm">API key table preview</div>
              </div>
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-dark/60 backdrop-blur-sm border border-white/[0.06]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <div class="text-center">
                  <div class="font-display font-semibold text-white/70 text-[15px]">Pro only</div>
                  <div class="font-body text-white/35 text-[13px] mt-1">Upgrade to Pro to access the API</div>
                </div>
                <button class="billing-btn billing-btn--primary" @click="activeTab = 'billing'">Upgrade to Pro →</button>
              </div>
            </div>

            <!-- API keys panel (Pro) -->
            <div v-else class="mt-8 space-y-5">

              <!-- Generate button + new key reveal -->
              <div class="notif-card">
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <div class="font-display font-semibold text-white text-[15px]">API Keys</div>
                    <div class="font-body text-white/40 text-[13px] mt-0.5">Each key grants full API access. Revoke immediately if compromised.</div>
                  </div>
                  <button
                    class="billing-btn billing-btn--primary shrink-0"
                    :disabled="apiKeyGenerating"
                    @click="generateKey"
                  >{{ apiKeyGenerating ? 'Generating…' : '+ New key' }}</button>
                </div>

                <!-- One-time reveal -->
                <div v-if="newRawKey" class="mb-4 p-4 rounded-xl bg-dark border border-primary/20">
                  <div class="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffaa00"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    <span class="font-display font-semibold text-[#ffaa00] text-[12px] tracking-[0.1em] uppercase">Copy now — shown only once</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <code class="flex-1 font-mono text-[13px] text-white/80 bg-transparent truncate">{{ newRawKey }}</code>
                    <button class="billing-btn billing-btn--secondary shrink-0 text-[12px] py-2 px-3" @click="copyKey">
                      {{ keyCopied ? 'Copied!' : 'Copy' }}
                    </button>
                  </div>
                </div>

                <!-- Keys table -->
                <div v-if="apiKeyList.length > 0">
                  <div class="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-0 text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-white/25 px-2 mb-2">
                    <span>Key</span><span>Created</span><span>Last used</span><span></span>
                  </div>
                  <div v-for="k in apiKeyList" :key="k._id" class="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-2 py-3 border-b border-white/[0.04] last:border-0">
                    <code class="font-mono text-[13px] text-white/70 truncate">{{ k.prefix }}…</code>
                    <span class="font-body text-white/30 text-[12px] whitespace-nowrap">{{ formatDate(k.createdAt) }}</span>
                    <span class="font-body text-white/30 text-[12px] whitespace-nowrap">{{ k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never' }}</span>
                    <button class="font-body text-danger/60 hover:text-danger text-[12px] transition-colors" @click="revokeKey(k._id)">Revoke</button>
                  </div>
                </div>
                <div v-else class="text-center py-6 font-body text-white/20 text-sm">
                  No API keys yet — generate one above.
                </div>
              </div>

              <!-- curl example -->
              <div class="notif-card">
                <div class="font-display font-semibold text-white text-[15px] mb-4">Usage example</div>
                <pre class="bg-dark rounded-xl p-4 text-[12px] font-mono text-white/60 overflow-x-auto leading-relaxed"><code><span class="text-white/30"># Run a scan</span>
curl -X POST https://hip-bass-536.eu-west-1.convex.site/api/scan \
  -H "Authorization: Bearer sp_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

<span class="text-white/30"># Fetch results</span>
curl "https://hip-bass-536.eu-west-1.convex.site/api/scan?id=SCAN_ID" \
  -H "Authorization: Bearer sp_live_YOUR_KEY"</code></pre>
              </div>

            </div>
          </div>
        </section>

        <!-- Danger Zone tab -->
        <section v-else-if="activeTab === 'danger'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px" style="background:#ff4757" />
              <span style="color:#ff4757">DANGER ZONE</span>
            </div>
            <h2 class="settings-heading">Account deletion</h2>
            <p class="settings-subtext">Permanently delete your account and all associated data.</p>
            <div class="mt-8 p-6 rounded-xl border border-danger/20 bg-dark-elevated text-white/40 font-body text-sm text-center">
              Danger zone component coming in Task 7
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Clerk UserProfile full-width override ───────────── */
.clerk-profile-wrapper {
  width: 100%;
}
.clerk-profile-wrapper :deep(.cl-rootBox),
.clerk-profile-wrapper :deep(.cl-cardBox),
.clerk-profile-wrapper :deep(.cl-card) {
  width: 100% !important;
  max-width: 100% !important;
}

/* ── Back link ───────────────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: color 0.15s ease;
}
.back-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

/* ── Sidebar tab (desktop) ───────────────────────────── */
.sidebar-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease, background 0.15s ease;
}
.sidebar-tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.04);
}
.sidebar-tab--active {
  color: #ec3586;
  background: rgba(236, 53, 134, 0.08);
}
.sidebar-tab--active svg {
  opacity: 1;
  color: #ec3586;
}

/* ── Mobile tabs ──────────────────────────────────────── */
.mobile-tab {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.mobile-tab:hover {
  color: rgba(255, 255, 255, 0.7);
}
.mobile-tab--active {
  color: #ec3586;
  background: rgba(236, 53, 134, 0.1);
  border-color: rgba(236, 53, 134, 0.25);
}

/* ── Billing buttons ──────────────────────────────────── */
.billing-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.billing-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.billing-btn--primary {
  background: #ec3586;
  color: white;
  border: none;
}
.billing-btn--primary:hover:not(:disabled) {
  background: #d42e77;
  transform: translateY(-1px);
}
.billing-btn--secondary {
  background: transparent;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.1);
}
.billing-btn--secondary:hover:not(:disabled) {
  color: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.2);
}

/* ── Usage cards ──────────────────────────────────────── */
.usage-card {
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  background: #0f0f14;
}
.usage-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 8px;
}
.usage-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 12px;
}
.usage-bar-track {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}
.usage-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.usage-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}

/* ── Notification cards ───────────────────────────────── */
.notif-card {
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  background: #0f0f14;
}

/* ── Toggle switch ────────────────────────────────────── */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s ease;
}
.toggle--off {
  background: rgba(255,255,255,0.12);
}
.toggle--off::after { left: 3px; }
.toggle--on {
  background: #ec3586;
}
.toggle--on::after { left: 23px; }

/* ── Alert threshold slider ───────────────────────────── */
.alert-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  outline: none;
  cursor: pointer;
}
.alert-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ec3586;
  cursor: pointer;
  border: 3px solid #0f0f14;
  box-shadow: 0 0 0 1px rgba(236,53,134,0.4);
  transition: box-shadow 0.15s ease;
}
.alert-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 4px rgba(236,53,134,0.2);
}
.alert-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ec3586;
  cursor: pointer;
  border: 3px solid #0f0f14;
}

/* ── Panel typography ─────────────────────────────────── */
.settings-panel {
  padding: 0;
}
.settings-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.settings-eyebrow span {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #ec3586;
  text-transform: uppercase;
}
.settings-heading {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: white;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 10px;
}
.settings-subtext {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}
</style>
