<script setup lang="ts">
import { useAppToast } from '~/composables/useAppToast'
const { userId } = useAuth()
const { api, client } = useConvex()
const route = useRoute()
const { toast } = useAppToast()

useSeoMeta({ title: 'Pricing — ScanPulse' })

const loading = ref(false)
const convexUserStr = ref<any>(null)

onMounted(async () => {
  if (userId.value) {
    const user = await client.query(api.users.getUserByClerkId, { clerkId: userId.value })
    if (user) {
      convexUserStr.value = user
    }
  }
})

async function handleUpgrade() {
  if (!userId.value) {
    return navigateTo('/sign-in')
  }

  loading.value = true
  try {
    const action = convexUserStr.value?.plan === 'pro' ? api.stripe.portal : api.stripe.pay
    const url = await client.action(action as any, { clerkId: userId.value })
    window.location.href = url
  } catch (err) {
    console.error(err)
    toast.error('Failed to connect to billing portal. Please try again.')
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark">
    <NavBar />

    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);
        background-size:64px 64px"
    />

    <div class="relative z-10 max-w-5xl mx-auto px-8 pt-32 pb-24 flex flex-col items-center">
      
      <div v-if="route.query.canceled" class="mb-8 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl max-w-md text-center font-body text-sm">
        Checkout was canceled. If you had trouble, please try again or contact support.
      </div>

      <div class="text-center mb-16">
        <h1 class="font-display font-bold text-white leading-none tracking-[-0.04em] mb-4" style="font-size: clamp(2.5rem, 5vw, 4rem)">
          Simple, transparent pricing
        </h1>
        <p class="font-body text-white/50 text-lg max-w-xl mx-auto">
          Start for free to see what's broken. Upgrade to Pro when you're ready for continuous monitoring and unrestricted scans.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        <!-- FREE PLAN -->
        <div class="relative p-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] flex flex-col">
          <div class="mb-8">
            <h3 class="font-display font-bold text-xl text-white mb-2">Hobby</h3>
            <div class="flex items-baseline gap-1">
              <span class="font-display font-bold text-4xl text-white">$0</span>
              <span class="text-white/30 font-body">/ forever</span>
            </div>
          </div>

          <ul class="space-y-4 mb-10 flex-1">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/70 font-body text-sm">1 full scan to try it out</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/70 font-body text-sm">Standard PDF report export</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/70 font-body text-sm">Shareable public result links</span>
            </li>
          </ul>

          <button
            class="w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide bg-white/[0.05] text-white/50 border border-white/[0.1] cursor-not-allowed"
            disabled
          >
            {{ convexUserStr?.plan === 'free' ? 'Current Plan' : 'Free Forever' }}
          </button>
        </div>

        <!-- PRO PLAN -->
        <div class="relative p-8 rounded-3xl border border-primary/30 bg-primary/5 flex flex-col">
          <!-- Glow -->
          <div class="absolute inset-0 rounded-3xl pointer-events-none" style="background: radial-gradient(ellipse at top, rgba(236,53,134,0.15), transparent 70%)" />
          
          <div class="relative z-10 mb-8">
            <h3 class="font-display font-bold text-xl text-primary mb-2">Pro</h3>
            <div class="flex items-baseline gap-1">
              <span class="font-display font-bold text-4xl text-white">$15</span>
              <span class="text-white/30 font-body">/ month</span>
            </div>
          </div>

          <ul class="relative z-10 space-y-4 mb-10 flex-1">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/90 font-body text-sm"><strong>Unlimited</strong> manual scans</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/90 font-body text-sm"><strong>Automated background monitoring</strong> (Hourly, Daily, Weekly)</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/90 font-body text-sm"><strong>Email alerts</strong> on score regression</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span class="text-white/90 font-body text-sm">Instant specific fix recommendations</span>
            </li>
          </ul>

          <button
            class="relative z-10 w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide transition-all bg-primary text-white hover:bg-primary-hover shadow-[0_0_20px_rgba(236,53,134,0.3)] hover:shadow-[0_0_30px_rgba(236,53,134,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleUpgrade"
            :disabled="loading"
          >
            <span v-if="loading">Processing...</span>
            <span v-else-if="convexUserStr?.plan === 'pro'">Manage Subscription</span>
            <span v-else>Upgrade to Pro</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
