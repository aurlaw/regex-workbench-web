<script setup lang="ts">
import { computed } from 'vue'
import type { DiffSegment } from '../types/regex'
import { useClipboard } from '../composables/useClipboard'

const props = defineProps<{
  diff: readonly DiffSegment[]
}>()

const { copy: copyResult, justCopied: resultCopied } = useClipboard()

const resultText = computed(() =>
  props.diff
    .filter((s) => s.kind !== 'removed')
    .map((s) => s.value)
    .join(''),
)

const hasDiff = computed(() => props.diff.some((s) => s.kind !== 'unchanged'))
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Replace Preview</span>
      <button
        v-if="resultText"
        type="button"
        @click="copyResult(resultText)"
        class="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors"
        :class="resultCopied ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'"
      >
        <svg v-if="resultCopied" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
        </svg>
        {{ resultCopied ? 'Copied!' : 'Copy Result' }}
      </button>
    </div>
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <pre v-if="hasDiff" key="diff" class="overflow-auto p-4 font-mono text-sm whitespace-pre-wrap dark:text-gray-200"><template
        v-for="(segment, i) in diff"
        :key="i"
      ><span
          v-if="segment.kind === 'unchanged'"
        >{{ segment.value }}</span><span
          v-else-if="segment.kind === 'removed'"
          class="bg-red-200 line-through text-red-800 dark:bg-red-900/40 dark:text-red-300"
        >{{ segment.value }}</span><span
          v-else-if="segment.kind === 'added'"
          class="bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        >{{ segment.value }}</span></template></pre>
      <p v-else key="empty" class="p-4 text-sm text-gray-400 dark:text-gray-500 italic">No replacements to preview</p>
    </Transition>
  </div>
</template>
