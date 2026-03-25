<script setup lang="ts">
const props = defineProps<{ size?: 'lg' | 'sm' }>()
const emit = defineEmits<{ scan: [url: string] }>()

const url = ref('')
const loading = ref(false)

function normalise(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function submit() {
  const finalUrl = normalise(url.value)
  if (!finalUrl) return
  loading.value = true
  emit('scan', finalUrl)
}
</script>

<template>
  <form @submit.prevent="submit" class="flex gap-3" :class="props.size === 'lg' ? 'flex-col sm:flex-row' : 'flex-row'">
    <input
      v-model="url"
      type="text"
      placeholder="https://yoursite.com"
      class="input-field flex-1"
      :class="props.size === 'lg' ? 'text-lg py-4' : ''"
      :disabled="loading"
    />
    <button type="submit" class="btn-primary whitespace-nowrap" :disabled="loading || !url.trim()">
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12" />
        </svg>
        Scanning…
      </span>
      <span v-else>{{ props.size === 'lg' ? 'Scan my website →' : 'Scan →' }}</span>
    </button>
  </form>
</template>
