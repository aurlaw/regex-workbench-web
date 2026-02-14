<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RegexFlags } from './types/regex'
import { useRegexEngine } from './composables/useRegexEngine'
import PatternEditor from './components/PatternEditor.vue'
import TestTextEditor from './components/TestTextEditor.vue'
import ResultsPanel from './components/ResultsPanel.vue'

const pattern = ref('')
const testText = ref('')
const flags = ref<RegexFlags>({
  global: true,
  caseInsensitive: false,
  multiline: false,
  dotAll: false,
  unicode: false,
})

const { validation, matches } = useRegexEngine(pattern, testText, flags)

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
      <h1 class="text-xl font-bold text-gray-900">RegEx Workbench</h1>
      <p class="text-sm text-gray-500">Test and visualize regular expressions in real time</p>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
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
