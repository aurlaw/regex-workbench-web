<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RegexFlags } from '../types/regex'
import type { AiPatternResult } from '../types/ai'
import { useAiPatternBuilder } from '../composables/useAiPatternBuilder'
import { useAuth } from '../composables/useAuth'
import { isSuccess } from '../types/result'

const props = defineProps<{
  highlightedText: string
  surroundingContext: string
  position: { top: number; left: number }
  isAlreadyMatched: boolean
  testText: string
}>()

const emit = defineEmits<{
  apply: [payload: { pattern: string; flags: RegexFlags }]
  close: []
}>()

const { generatePattern, isGenerating, rateLimitInfo } = useAiPatternBuilder()
const { isAuthenticated, signInWithGitHub } = useAuth()

const intent = ref('')
const result = ref<AiPatternResult | null>(null)
const error = ref<string | null>(null)
const editableFlags = ref<RegexFlags | null>(null)
const animateIn = ref(false)
const isMobile = ref(false)

// Session history — last 5 generated patterns
const history = ref<AiPatternResult[]>([])
const showHistory = ref(false)

const currentFlags = computed(() => editableFlags.value ?? result.value?.suggestedFlags ?? null)

const confidenceColor = computed(() => {
  switch (result.value?.confidence) {
    case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
    case 'low': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    default: return ''
  }
})

function confidenceColorFor(confidence: string) {
  switch (confidence) {
    case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
    case 'low': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    default: return ''
  }
}

const rateLimitDisplay = computed(() => {
  const info = rateLimitInfo.value
  if (info.remaining === null || info.limit === null) return null
  return `${info.remaining}/${info.limit} remaining today`
})

// Check if the generated pattern would produce matches in the test text
const noMatchWarning = computed(() => {
  if (!result.value || !currentFlags.value) return false
  try {
    let flagStr = ''
    if (currentFlags.value.global) flagStr += 'g'
    if (currentFlags.value.caseInsensitive) flagStr += 'i'
    if (currentFlags.value.multiline) flagStr += 'm'
    if (currentFlags.value.dotAll) flagStr += 's'
    if (currentFlags.value.unicode) flagStr += 'u'
    const re = new RegExp(result.value.pattern, flagStr)
    return !re.test(props.testText)
  } catch {
    return false
  }
})

async function handleGenerate() {
  error.value = null
  result.value = null
  editableFlags.value = null
  showHistory.value = false

  const res = await generatePattern(props.highlightedText, props.surroundingContext, intent.value || undefined)

  if (isSuccess(res)) {
    result.value = res.value
    editableFlags.value = { ...res.value.suggestedFlags }
    // Add to history (keep last 5)
    history.value = [res.value, ...history.value.filter(h => h.pattern !== res.value.pattern)].slice(0, 5)
  } else {
    error.value = res.error
  }
}

function restoreFromHistory(entry: AiPatternResult) {
  result.value = entry
  editableFlags.value = { ...entry.suggestedFlags }
  error.value = null
  showHistory.value = false
}

function toggleFlag(key: keyof RegexFlags) {
  if (!editableFlags.value) return
  editableFlags.value = { ...editableFlags.value, [key]: !editableFlags.value[key] }
}

function handleApply() {
  if (!result.value || !currentFlags.value) return
  emit('apply', { pattern: result.value.pattern, flags: currentFlags.value })
  emit('close')
}

const panelRef = ref<HTMLElement | null>(null)
let dismissReady = false

function onClickOutside(e: MouseEvent) {
  if (!dismissReady) return
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', onKeydown)

  // Delay click-outside registration so the opening click doesn't
  // immediately close the panel. Use two rAF to guarantee the
  // browser has painted at least one frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', onClickOutside)
      dismissReady = true
      animateIn.value = true
    })
  })
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', checkMobile)
})

const flagToggles = [
  { key: 'global' as const, label: 'g', tooltip: 'Global' },
  { key: 'caseInsensitive' as const, label: 'i', tooltip: 'Case Insensitive' },
  { key: 'multiline' as const, label: 'm', tooltip: 'Multiline' },
  { key: 'dotAll' as const, label: 's', tooltip: 'Dot All' },
  { key: 'unicode' as const, label: 'u', tooltip: 'Unicode' },
]
</script>

<template>
  <!-- Backdrop for mobile bottom sheet -->
  <div
    v-if="isMobile"
    class="fixed inset-0 z-40 bg-black/30 transition-opacity duration-200"
    :class="animateIn ? 'opacity-100' : 'opacity-0'"
    @click="emit('close')"
  />

  <div
    ref="panelRef"
    class="z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
    :class="[
      isMobile
        ? 'fixed inset-x-0 bottom-0 w-full rounded-b-none transition-transform duration-300 ease-out'
        : 'fixed transition-all duration-200 ease-out',
      isMobile
        ? (animateIn ? 'translate-y-0' : 'translate-y-full')
        : (animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'),
    ]"
    :style="isMobile ? undefined : { top: position.top + 'px', left: position.left + 'px' }"
  >
    <!-- Drag handle for mobile -->
    <div v-if="isMobile" class="flex justify-center pt-2 pb-1">
      <div class="h-1 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
    </div>

    <!-- Not authenticated -->
    <div v-if="!isAuthenticated" class="p-4 text-center">
      <svg class="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
      </svg>
      <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Sign in with GitHub to use AI-assisted pattern generation
      </p>
      <button
        type="button"
        @click="signInWithGitHub"
        class="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Sign in with GitHub
      </button>
    </div>

    <!-- Authenticated builder -->
    <div v-else class="p-4 space-y-3" :class="isMobile ? 'pb-6' : ''">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Pattern Builder</h3>
        <div class="flex items-center gap-1">
          <!-- History button -->
          <button
            v-if="history.length > 0"
            type="button"
            :title="showHistory ? 'Hide history' : 'Show history'"
            @click="showHistory = !showHistory"
            class="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            :class="showHistory ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : ''"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
          </button>
          <!-- Close button -->
          <button
            type="button"
            @click="emit('close')"
            class="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- History panel -->
      <div v-if="showHistory" class="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
        <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent patterns</p>
        <ul class="space-y-1">
          <li v-for="(entry, i) in history" :key="i">
            <button
              type="button"
              @click="restoreFromHistory(entry)"
              class="flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-700 dark:text-gray-300">{{ entry.pattern }}</span>
              <span
                class="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none"
                :class="confidenceColorFor(entry.confidence)"
              >{{ entry.confidence }}</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Selected text preview -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
        <p class="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Selected text</p>
        <p class="max-h-16 overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200 break-words">{{ highlightedText }}</p>
      </div>

      <!-- Already matched note -->
      <p v-if="isAlreadyMatched" class="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
        <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        This text is already matched by your current pattern
      </p>

      <!-- Intent input -->
      <input
        v-model="intent"
        type="text"
        placeholder="e.g., match all email addresses"
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
      />

      <!-- Generate button -->
      <button
        v-if="!result"
        type="button"
        :disabled="isGenerating"
        @click="handleGenerate"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg v-if="isGenerating" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ isGenerating ? 'Generating...' : 'Generate Pattern' }}
      </button>

      <!-- Error state -->
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
        <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Result -->
      <template v-if="result">
        <!-- Pattern with confidence -->
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
          <div class="mb-1 flex items-center gap-2">
            <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pattern</p>
            <span
              class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
              :class="confidenceColor"
            >{{ result.confidence }}</span>
          </div>
          <p class="font-mono text-xs text-gray-800 dark:text-gray-200 break-all select-all">{{ result.pattern }}</p>
        </div>

        <!-- No-match warning -->
        <div v-if="noMatchWarning" class="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20">
          <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <p class="text-xs text-amber-700 dark:text-amber-400">This pattern doesn't match anything in your current test text</p>
        </div>

        <!-- Explanation -->
        <p class="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{{ result.explanation }}</p>

        <!-- Flag toggles -->
        <div v-if="currentFlags" class="flex items-center gap-1">
          <span class="mr-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Flags</span>
          <button
            v-for="flag in flagToggles"
            :key="flag.key"
            type="button"
            :title="flag.tooltip"
            @click="toggleFlag(flag.key)"
            class="h-6 w-6 rounded text-xs font-mono font-bold transition-colors"
            :class="[
              currentFlags[flag.key]
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600',
            ]"
          >
            {{ flag.label }}
          </button>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2">
          <button
            type="button"
            @click="handleApply"
            class="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Apply Pattern
          </button>
          <button
            type="button"
            :disabled="isGenerating"
            @click="handleGenerate"
            class="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg v-if="isGenerating" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Regenerate
          </button>
        </div>
      </template>

      <!-- Rate limit info -->
      <p v-if="rateLimitDisplay" class="text-center text-[11px] text-gray-400 dark:text-gray-500">
        {{ rateLimitDisplay }}
      </p>
    </div>
  </div>
</template>
