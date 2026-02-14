<script setup lang="ts">
import { computed } from 'vue'
import type { RegexFlags, RegexValidation } from '../types/regex'
import { useClipboard } from '../composables/useClipboard'

const props = defineProps<{
  pattern: string
  flags: RegexFlags
  validation: RegexValidation
}>()

const emit = defineEmits<{
  'update:pattern': [value: string]
  'update:flags': [value: RegexFlags]
}>()

const flagToggles = [
  { key: 'global', label: 'g', tooltip: 'Global — find all matches' },
  { key: 'caseInsensitive', label: 'i', tooltip: 'Case Insensitive — ignore upper/lower case' },
  { key: 'multiline', label: 'm', tooltip: 'Multiline — ^ and $ match line boundaries' },
  { key: 'dotAll', label: 's', tooltip: 'Dot All — . matches newlines' },
  { key: 'unicode', label: 'u', tooltip: 'Unicode — enable Unicode matching' },
] as const

function toggleFlag(key: keyof RegexFlags) {
  emit('update:flags', { ...props.flags, [key]: !props.flags[key] })
}

const showValid = computed(() => props.pattern !== '' && props.validation.isValid)
const showInvalid = computed(() => props.pattern !== '' && !props.validation.isValid)

const { copy: copyPattern, justCopied: patternCopied } = useClipboard()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">/</span>
        <input
          type="text"
          :value="pattern"
          @input="emit('update:pattern', ($event.target as HTMLInputElement).value)"
          placeholder="Enter regex pattern..."
          spellcheck="false"
          autocomplete="off"
          class="w-full rounded-lg border bg-white py-2 pl-7 pr-3 font-mono text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/40"
          :class="[
            showInvalid
              ? 'border-red-400 focus:border-red-500'
              : showValid
                ? 'border-green-400 focus:border-green-500'
                : 'border-gray-300 focus:border-blue-500',
          ]"
        />
        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">/</span>
      </div>

      <button
        v-if="pattern"
        type="button"
        title="Copy pattern"
        @click="copyPattern(pattern)"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <svg v-if="patternCopied" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
        </svg>
      </button>

      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center"
        :title="showInvalid ? validation.error : showValid ? 'Valid pattern' : ''"
      >
        <svg v-if="showValid" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="showInvalid" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <p v-if="showInvalid" class="text-sm text-red-600">{{ validation.error }}</p>

    <div class="flex items-center gap-1">
      <span class="mr-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Flags</span>
      <button
        v-for="flag in flagToggles"
        :key="flag.key"
        type="button"
        :title="flag.tooltip"
        @click="toggleFlag(flag.key)"
        class="h-8 w-8 rounded text-sm font-mono font-bold transition-colors"
        :class="[
          flags[flag.key]
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
        ]"
      >
        {{ flag.label }}
      </button>
    </div>
  </div>
</template>
