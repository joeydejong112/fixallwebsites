<script setup lang="ts">
interface Props {
  active: number
  sections: { id: string; label: string }[]
}
const props = defineProps<Props>()
const emit = defineEmits<{ go: [index: number] }>()

const railHeight = computed(() =>
  `${((props.active + 1) / props.sections.length) * 100}%`
)
</script>

<template>
  <nav
    class="fixed left-[36px] top-1/2 -translate-y-1/2 z-50 flex flex-col gap-[14px]"
    aria-label="Section navigation"
  >
    <!-- Background rail -->
    <div class="absolute left-[5px] top-[-14px] bottom-[-14px] w-[2px] bg-white/10">
      <!-- Filled progress -->
      <div
        class="w-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :style="{ height: railHeight }"
        :class="active > 0 ? 'shadow-[0_0_10px_rgba(236,53,134,0.5)]' : ''"
      />
    </div>

    <!-- Dot buttons -->
    <button
      v-for="(s, i) in sections"
      :key="s.id"
      class="relative z-10 w-3 h-3 rounded-full border-none cursor-pointer p-0 ml-0 transition-all duration-200"
      :class="i === active ? 'bg-primary shadow-[0_0_12px_rgba(236,53,134,0.6)]' : 'bg-white/25 hover:bg-white/50'"
      :style="i !== active ? 'box-shadow: none' : ''"
      :aria-label="`Go to ${s.label}`"
      :title="s.label"
      @click="emit('go', i)"
    />
  </nav>
</template>