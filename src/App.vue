<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RegexFlags } from './types/regex'
import { useRegexEngine } from './composables/useRegexEngine'
import { useRegexReplace } from './composables/useRegexReplace'
import { useClipboard } from './composables/useClipboard'
import { parseUrlState, useShareableUrl } from './composables/useShareableUrl'
import { useDarkMode } from './composables/useDarkMode'
import PatternEditor from './components/PatternEditor.vue'
import ReplaceEditor from './components/ReplaceEditor.vue'
import TestTextEditor from './components/TestTextEditor.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import MatchStats from './components/MatchStats.vue'
import ReplacePreview from './components/ReplacePreview.vue'
import ShortcutsHelp from './components/ShortcutsHelp.vue'
import AuthButton from './components/AuthButton.vue'

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
const mode = ref<'match' | 'replace'>(initial?.mode ?? 'match')
const replacement = ref(initial?.replacement ?? '')

const { validation, matches } = useRegexEngine(pattern, testText, flags)
const { diff } = useRegexReplace(pattern, flags, testText, replacement)
const { getShareUrl } = useShareableUrl(pattern, flags, testText, replacement, mode)
const { copy: copyShareUrl, justCopied: shareCopied } = useClipboard()
const { isDark, toggle: toggleDark } = useDarkMode()

const patternEditorRef = ref<InstanceType<typeof PatternEditor> | null>(null)
const testTextEditorRef = ref<InstanceType<typeof TestTextEditor> | null>(null)

function share() {
  copyShareUrl(getShareUrl())
}

function reset() {
  pattern.value = ''
  testText.value = ''
  flags.value = { ...defaultFlags }
  replacement.value = ''
  mode.value = 'match'
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

const diffValue = computed(() =>
  diff.value.kind === 'success' ? diff.value.value : [],
)

function onKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key === 'l') {
    e.preventDefault()
    patternEditorRef.value?.focus()
  } else if (mod && e.key === 't') {
    e.preventDefault()
    testTextEditorRef.value?.focus()
  } else if (e.key === 'Escape') {
    ;(document.activeElement as HTMLElement)?.blur()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <header class="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-center justify-between gap-y-2">
        <div>
          <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <img src="/logo.png" alt="RegEx Workbench logo" class="h-8 w-8" />
            RegEx Workbench
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Test and visualize regular expressions in real time</p>
        </div>
        <div class="flex items-center gap-2">
          <AuthButton />
          <button
            type="button"
            title="Toggle dark mode"
            @click="toggleDark"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <!-- Sun icon (shown in dark mode) -->
            <svg v-if="isDark" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <!-- Moon icon (shown in light mode) -->
            <svg v-else class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>
          <ShortcutsHelp />
          <button
            v-if="hasInput"
            type="button"
            @click="reset"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
            :class="shareCopied ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'"
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

    <main class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="mx-auto mb-6 max-w-7xl">
        <div class="mb-4 flex items-center gap-4">
          <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              @click="mode = 'match'"
              class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              :class="mode === 'match' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'"
            >
              Match
            </button>
            <button
              type="button"
              @click="mode = 'replace'"
              class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              :class="mode === 'replace' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'"
            >
              Replace
            </button>
          </div>
        </div>
        <MatchStats :matches="matchesValue" :test-text-length="testText.length" :has-pattern="pattern !== ''" />
      </div>
      <div class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pattern</h2>
          <PatternEditor
            ref="patternEditorRef"
            :pattern="pattern"
            :flags="flags"
            :validation="validationValue"
            @update:pattern="pattern = $event"
            @update:flags="flags = $event"
          />
          <div v-if="mode === 'replace'" class="mt-3">
            <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Replacement</h2>
            <ReplaceEditor
              :replacement="replacement"
              @update:replacement="replacement = $event"
            />
          </div>
        </section>

        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Test Text</h2>
          <TestTextEditor ref="testTextEditorRef" v-model="testText" :matches="matchesValue" />
          <div v-if="mode === 'replace'" class="mt-4">
            <ReplacePreview :diff="diffValue" />
          </div>
        </section>

        <section>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Results</h2>
          <ResultsPanel :matches="matchesValue" :has-pattern="pattern !== ''" />
        </section>
      </div>
    </main>

    <footer class="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">Built with Vue 3 + TypeScript</span>
        <a
          href="https://github.com/aurlaw/regex-workbench-web"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          GitHub
        </a>
      </div>
    </footer>
  </div>
</template>
