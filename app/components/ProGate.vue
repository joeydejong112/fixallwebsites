<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  feature?: string
}>()

const { client, api } = useConvex()
const { userId } = useAuth()

const isPro = ref(false)
const loading = ref(true)

onMounted(async () => {
  if (!userId.value) { loading.value = false; return }
  try {
    const user = await client.query(api.users.getUserByClerkId, { clerkId: userId.value })
    isPro.value = user?.plan === 'pro'
  } catch {
    isPro.value = false
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- Pro users: render content directly -->
  <slot v-if="isPro || loading" />

  <!-- Free users: blurred content + upgrade overlay -->
  <div v-else class="pro-gate-wrapper">
    <div class="pro-gate-content">
      <slot />
    </div>

    <div class="pro-gate-overlay">
      <div class="pro-gate-card">
        <div class="pro-gate-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        <p class="pro-gate-label">Pro feature</p>
        <h3 class="pro-gate-title">{{ feature ?? 'Upgrade to Pro to unlock' }}</h3>
        <p class="pro-gate-sub">Get full access to all advanced features, bulk tools, and platform-specific guides.</p>

        <NuxtLink to="/settings?tab=billing" class="pro-gate-btn">
          Upgrade to Pro
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pro-gate-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.pro-gate-content {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
  opacity: 0.4;
  flex: 1;
}

.pro-gate-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 7, 10, 0.6);
  backdrop-filter: blur(2px);
  z-index: 10;
  border-radius: inherit;
}

.pro-gate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 32px;
  background: rgba(15, 15, 20, 0.95);
  border: 1px solid rgba(236, 53, 134, 0.25);
  border-radius: 12px;
  max-width: 300px;
  gap: 8px;
}

.pro-gate-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(236, 53, 134, 0.1);
  border: 1px solid rgba(236, 53, 134, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ec3586;
  margin-bottom: 4px;
}

.pro-gate-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ec3586;
}

.pro-gate-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.3;
}

.pro-gate-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.5;
  margin: 0;
}

.pro-gate-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ec3586;
  color: white;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 3px;
  margin-top: 8px;
  transition: background 0.15s ease, transform 0.15s ease;
}

.pro-gate-btn:hover {
  background: #d42e77;
  transform: translateY(-1px);
}
</style>
