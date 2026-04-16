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
  <div class="h-14 bg-[#0f0f14] border-b border-[#1e1e28] flex items-center px-[22px] gap-4 flex-shrink-0">
    <div class="flex items-center gap-[10px]">
      <button v-if="showBack" class="bg-none border border-[#1e1e28] rounded-lg p-[5px_8px] text-[#9898b0] cursor-pointer flex items-center transition-colors hover:text-[#e8e8f0] hover:border-white/15" @click="emit('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
      </button>
      <div>
        <div class="font-display font-semibold text-[15px] text-[#e8e8f0]">{{ title }}</div>
        <div class="text-[11px] text-[#6b7280] mt-[1px]">{{ subtitle }}</div>
      </div>
    </div>
    <div class="flex-1" />
    <div class="flex items-center gap-[8px]">
      <input
        :value="modelValue"
        class="bg-[#16161e] border border-[#1e1e28] rounded-lg px-[14px] py-[7px] text-[13px] text-[#e8e8f0] w-[260px] outline-none font-body transition-colors focus:border-primary/40 placeholder:text-[#6b7280]"
        placeholder="https://example.com"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('submit')"
      />
      <button class="bg-primary text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer flex items-center gap-[7px] font-body transition-opacity whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed hover:not(:disabled):opacity-90" :disabled="scanning" @click="emit('submit')">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
        {{ scanning ? 'Scanning…' : 'New Scan' }}
      </button>
    </div>
  </div>
</template>