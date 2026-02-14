<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RegexFlags } from './types/regex'
import { useRegexEngine } from './composables/useRegexEngine'
import { useClipboard } from './composables/useClipboard'
import { parseUrlState, useShareableUrl } from './composables/useShareableUrl'
import PatternEditor from './components/PatternEditor.vue'
import TestTextEditor from './components/TestTextEditor.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import MatchStats from './components/MatchStats.vue'

const defaultFlags: RegexFlags = {
  global: true,
  caseInsensitive: false,
  multiline: false,
  dotAll: false,
  unicode: false,
}

const initial = parseUrlState()

const pattern = ref(initial?.pattern ?? '')
const testText = ref(initial?.testText ?? '')
const flags = ref<RegexFlags>(initial?.flags ?? { ...defaultFlags })

const { validation, matches } = useRegexEngine(pattern, testText, flags)
const { getShareUrl } = useShareableUrl(pattern, flags, testText)
const { copy: copyShareUrl, justCopied: shareCopied } = useClipboard()

function share() {
  copyShareUrl(getShareUrl())
}

function reset() {
  pattern.value = ''
  testText.value = ''
  flags.value = { ...defaultFlags }
}

const hasInput = computed(() => pattern.value !== '' || testText.value !== '')

const validationValue = computed(() =>
  validation.value.kind === 'success'
    ? validation.value.value
    : { isValid: false, error: validation.value.error },
)

const matchesValue = computed(() =>
  matches.value.kind === 'success' ? matches.value.value : [],
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="border-b border-gray-200 bg-white px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900">
            <img src="/logo.png" alt="RegEx Workbench logo" class="h-8 w-8" />
            RegEx Workbench
          </h1>
          <p class="text-sm text-gray-500">Test and visualize regular expressions in real time</p>
        </div>
        <div class="flex items-center gap-2">
        <button
          v-if="hasInput"
          type="button"
          @click="reset"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Reset
        </button>
        <button
          type="button"
          @click="share"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="shareCopied ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
        >
          <svg v-if="shareCopied" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          {{ shareCopied ? 'Link Copied!' : 'Share' }}
        </button>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto mb-6 max-w-7xl">
        <MatchStats :matches="matchesValue" :test-text-length="testText.length" :has-pattern="pattern !== ''" />
      </div>
      <div class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Pattern</h2>
          <PatternEditor
            :pattern="pattern"
            :flags="flags"
            :validation="validationValue"
            @update:pattern="pattern = $event"
            @update:flags="flags = $event"
          />
        </section>

        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Test Text</h2>
          <TestTextEditor v-model="testText" :matches="matchesValue" />
        </section>

        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Results</h2>
          <ResultsPanel :matches="matchesValue" :has-pattern="pattern !== ''" />
        </section>
      </div>
    </main>
  </div>
</template>
