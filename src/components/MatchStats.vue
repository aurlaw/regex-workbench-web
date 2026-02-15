<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RegexMatch } from '../types/regex'

const props = defineProps<{
  matches: readonly RegexMatch[]
  testTextLength: number
  hasPattern: boolean
}>()

const displayCount = ref(0)
const displayChars = ref(0)
const displayPercent = ref(0)

const totalChars = computed(() =>
  props.matches.reduce((sum, m) => sum + m.length, 0),
)

const percent = computed(() => {
  if (props.testTextLength === 0) return 0
  return Math.round((totalChars.value / props.testTextLength) * 100)
})

function animateValue(
  from: number,
  to: number,
  setter: (v: number) => void,
  duration = 200,
) {
  if (from === to) return
  const start = performance.now()
  function step(now: number) {
    const t = Math.min((now - start) / duration, 1)
    setter(Math.round(from + (to - from) * t))
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

watch(
  () => props.matches.length,
  (to, from) => animateValue(from ?? 0, to, (v) => (displayCount.value = v)),
  { immediate: true },
)

watch(
  totalChars,
  (to, from) => animateValue(from ?? 0, to, (v) => (displayChars.value = v)),
  { immediate: true },
)

watch(
  percent,
  (to, from) => animateValue(from ?? 0, to, (v) => (displayPercent.value = v)),
  { immediate: true },
)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div v-if="hasPattern" class="flex items-center gap-3 rounded-lg border px-4 py-2"
      :class="matches.length > 0
        ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        : 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'"
    >
      <template v-if="matches.length > 0">
        <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {{ displayCount }} {{ matches.length === 1 ? 'match' : 'matches' }}
        </span>
        <span class="text-gray-300 dark:text-gray-600" aria-hidden="true">&middot;</span>
        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {{ displayChars }} {{ totalChars === 1 ? 'char' : 'chars' }}
        </span>
        <span class="text-gray-300 dark:text-gray-600" aria-hidden="true">&middot;</span>
        <span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          {{ displayPercent }}% of text
        </span>
      </template>
      <template v-else>
        <span class="text-xs font-medium text-amber-600 dark:text-amber-400">No matches</span>
      </template>
    </div>
  </Transition>
</template>
