<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  showBack: boolean
  scanning: boolean
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'submit'): void
  (e: 'update:modelValue', v: string): void
}>()
</script>

<template>
  <div class="ds-topbar">
    <div class="ds-topbar-left">
      <button v-if="showBack" class="ds-back-btn" @click="emit('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
      </button>
      <div>
        <div class="ds-topbar-title">{{ title }}</div>
        <div class="ds-topbar-sub">{{ subtitle }}</div>
      </div>
    </div>
    <div class="ds-topbar-spacer" />
    <div class="ds-scan-row">
      <input
        :value="modelValue"
        class="ds-scan-input"
        placeholder="https://example.com"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('submit')"
      />
      <button class="ds-scan-btn" :disabled="scanning" @click="emit('submit')">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
        {{ scanning ? 'Scanning…' : 'New Scan' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ds-topbar { height: 56px; background: #0f0f14; border-bottom: 1px solid #1e1e28; display: flex; align-items: center; padding: 0 22px; gap: 16px; flex-shrink: 0; }
.ds-topbar-left { display: flex; align-items: center; gap: 10px; }
.ds-back-btn { background: none; border: 1px solid #1e1e28; border-radius: 7px; padding: 5px 8px; color: #9898b0; cursor: pointer; display: flex; align-items: center; transition: color 0.1s, border-color 0.1s; }
.ds-back-btn:hover { color: #e8e8f0; border-color: rgba(255,255,255,0.15); }
.ds-topbar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; color: #e8e8f0; }
.ds-topbar-sub { font-size: 11px; color: #6b7280; margin-top: 1px; }
.ds-topbar-spacer { flex: 1; }
.ds-scan-row { display: flex; align-items: center; gap: 8px; }
.ds-scan-input { background: #16161e; border: 1px solid #1e1e28; border-radius: 8px; padding: 7px 14px; color: #e8e8f0; font-size: 13px; width: 260px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.ds-scan-input::placeholder { color: #6b7280; }
.ds-scan-input:focus { border-color: rgba(236,53,134,0.4); }
.ds-scan-btn { background: #ec3586; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; white-space: nowrap; }
.ds-scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ds-scan-btn:hover:not(:disabled) { opacity: 0.9; }
</style>