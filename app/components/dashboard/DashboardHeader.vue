<script setup lang="ts">
/**
 * DashboardHeader — greeting, monitor status, and CTA buttons.
 */
const { userId } = useAuth()
const { user } = useUser()

const firstName = computed(() => {
  if (!user.value) return 'there'
  return user.value.firstName || user.value.username || 'there'
})

const monitorCount = ref(3)
const regressedCount = ref(1)
</script>

<template>
  <div class="flex justify-between items-end">
    <div>
      <div class="eyebrow">Overview · {{ new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }}</div>
      <h1 class="display" style="font-size: 44px; margin: 14px 0 0">
        Good morning, {{ firstName }}.
      </h1>
      <p class="text-muted" style="font-size: 15px; margin: 8px 0 0">
        {{ monitorCount }} sites are monitored.
        {{ regressedCount }} regressed overnight.
        <a class="review-link">Review →</a>
      </p>
    </div>

    <div class="flex gap-2.5">
      <button class="btn btn-ghost">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New scan
      </button>
      <button class="btn btn-ghost">Bulk upload</button>
      <button class="btn btn-primary">
        Export report
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.review-link {
  color: var(--brand);
  cursor: pointer;
}
</style>
