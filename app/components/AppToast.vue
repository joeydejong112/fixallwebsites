<script setup lang="ts">
import { useAppToast } from '~/composables/useAppToast'
import { ref, onMounted } from 'vue'
const { state, resolveConfirm } = useAppToast()

const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const iconMap: Record<string, string> = {
  success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
  error:   `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`,
  warning: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />`,
  info:    `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
}
</script>

<template>
  <Teleport to="body" v-if="isMounted">
    <!-- ── Toast stack ── -->
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style="min-width:300px;max-width:400px">
      <TransitionGroup name="toast">
        <div
          v-for="t in state.toasts"
          :key="t.id"
          class="toast-item pointer-events-auto"
          :class="`toast--${t.type}`"
        >
          <svg class="toast-icon flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="iconMap[t.type]" />
          <p class="font-body text-sm text-white/90 leading-snug">{{ t.message }}</p>
        </div>
      </TransitionGroup>
    </div>

    <!-- ── Confirm dialog ── -->
    <Transition name="overlay">
      <div
        v-if="state.confirmOpen"
        class="fixed inset-0 z-[9998] flex items-center justify-center px-4"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(6px)"
        @click.self="resolveConfirm(false)"
      >
        <div class="confirm-card">
          <p class="font-display font-semibold text-white text-base mb-1">Are you sure?</p>
          <p class="font-body text-white/55 text-sm mb-6 leading-relaxed">{{ state.confirmMessage }}</p>
          <div class="flex items-center gap-3 justify-end">
            <button
              class="px-4 py-2 rounded-lg text-sm font-display font-bold text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 transition-colors"
              @click="resolveConfirm(false)"
            >{{ state.cancelLabel }}</button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-display font-bold text-white bg-danger hover:bg-danger/80 transition-colors"
              @click="resolveConfirm(true)"
            >{{ state.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(18, 18, 24, 0.97);
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  backdrop-filter: blur(12px);
}
.toast--success { border-left: 3px solid #00d4aa; }
.toast--success .toast-icon { color: #00d4aa; }
.toast--error   { border-left: 3px solid #ff4757; }
.toast--error   .toast-icon { color: #ff4757; }
.toast--warning { border-left: 3px solid #ffaa00; }
.toast--warning .toast-icon { color: #ffaa00; }
.toast--info    { border-left: 3px solid #6c5ce7; }
.toast--info    .toast-icon { color: #6c5ce7; }
.toast-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

.toast-enter-active   { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.toast-leave-active   { transition: all 0.2s ease; }
.toast-enter-from     { opacity: 0; transform: translateY(12px) scale(0.97); }
.toast-leave-to       { opacity: 0; transform: translateX(20px); }
.overlay-enter-active { transition: opacity 0.2s; }
.overlay-leave-active { transition: opacity 0.15s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.confirm-card {
  background: rgba(14, 14, 20, 0.98);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  backdrop-filter: blur(16px);
}
</style>
