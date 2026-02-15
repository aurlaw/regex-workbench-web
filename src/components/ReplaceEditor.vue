<script setup lang="ts">
import { useClipboard } from '../composables/useClipboard'

defineProps<{
  replacement: string
}>()

const emit = defineEmits<{
  'update:replacement': [value: string]
}>()

const { copy: copyReplacement, justCopied: replacementCopied } = useClipboard()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <input
        type="text"
        :value="replacement"
        @input="emit('update:replacement', ($event.target as HTMLInputElement).value)"
        placeholder="Replacement string (e.g. $1, $<name>)..."
        spellcheck="false"
        autocomplete="off"
        class="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 font-mono text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
      />
    </div>

    <button
      v-if="replacement"
      type="button"
      title="Copy replacement"
      @click="copyReplacement(replacement)"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
    >
      <svg v-if="replacementCopied" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      <svg v-else class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
      </svg>
    </button>
  </div>
</template>
