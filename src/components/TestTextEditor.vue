<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RegexMatch } from '../types/regex'
import { useSupabase } from '../composables/useSupabase'

type Segment =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'match'; readonly value: string; readonly matchIndex: number; readonly colorIndex: number }

const props = defineProps<{
  modelValue: string
  matches: readonly RegexMatch[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'openAiBuilder': [payload: {
    highlightedText: string
    surroundingContext: string
    selectionStart: number
    selectionEnd: number
    position: { top: number; left: number }
  }]
}>()

const { isConfigured } = useSupabase()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Snapshot of the last valid selection — persists until a new selection
// replaces it or the textarea blurs without a selection.
const pendingSelection = ref<{
  text: string
  context: string
  start: number
  end: number
} | null>(null)

defineExpose({
  focus() {
    textareaRef.value?.focus()
  },
})

function readSelection() {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = props.modelValue

  if (start === end || !text) {
    // Cursor placed without selection — clear only on explicit actions,
    // not here, so the bar stays visible until blur or new selection.
    return
  }

  const ctxStart = Math.max(0, start - 50)
  const ctxEnd = Math.min(text.length, end + 50)

  pendingSelection.value = {
    text: text.slice(start, end),
    context: text.slice(ctxStart, ctxEnd),
    start,
    end,
  }
}

function handleMouseUp() {
  setTimeout(readSelection, 10)
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.shiftKey) {
    readSelection()
  }
}

let blurTimer: ReturnType<typeof setTimeout> | null = null

function handleBlur() {
  // Delay clearing so that a click on "Build Pattern" can fire first
  blurTimer = setTimeout(() => {
    pendingSelection.value = null
    blurTimer = null
  }, 150)
}

function openBuilder() {
  // Cancel the pending blur clear — user clicked our button
  if (blurTimer) {
    clearTimeout(blurTimer)
    blurTimer = null
  }
  const sel = pendingSelection.value
  if (!sel) return

  const textarea = textareaRef.value
  if (!textarea) return

  const rect = textarea.getBoundingClientRect()
  const pos = {
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2 - 160,
  }

  emit('openAiBuilder', {
    highlightedText: sel.text,
    surroundingContext: sel.context,
    selectionStart: sel.start,
    selectionEnd: sel.end,
    position: pos,
  })

  pendingSelection.value = null
}

const showBuildButton = computed(() =>
  isConfigured.value && pendingSelection.value !== null,
)

const segments = computed<Segment[]>(() => {
  const text = props.modelValue
  if (text === '' || props.matches.length === 0) {
    return text ? [{ kind: 'text', value: text }] : []
  }

  const sorted = [...props.matches].sort((a, b) => a.index - b.index)
  const result: Segment[] = []
  let cursor = 0
  let colorIndex = 0

  for (let i = 0; i < sorted.length; i++) {
    const match = sorted[i]!

    if (match.index < cursor) continue

    if (match.index > cursor) {
      result.push({ kind: 'text', value: text.slice(cursor, match.index) })
    }

    result.push({
      kind: 'match',
      value: text.slice(match.index, match.index + match.length),
      matchIndex: i,
      colorIndex,
    })
    colorIndex = (colorIndex + 1) % 2
    cursor = match.index + match.length
  }

  if (cursor < text.length) {
    result.push({ kind: 'text', value: text.slice(cursor) })
  }

  return result
})
</script>

<template>
  <div class="space-y-3">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @mouseup="handleMouseUp"
      @keyup="handleKeyUp"
      @blur="handleBlur"
      placeholder="Enter test text..."
      spellcheck="false"
      rows="6"
      class="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
    />

    <!-- Build Pattern bar — inline between textarea and preview -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="showBuildButton"
        class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/20"
      >
        <svg class="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        <span class="min-w-0 flex-1 truncate font-mono text-xs text-blue-700 dark:text-blue-300">
          "{{ pendingSelection!.text }}"
        </span>
        <button
          type="button"
          @click="openBuilder"
          class="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          Build Pattern
        </button>
      </div>
    </Transition>

    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
      <p v-if="modelValue === ''" class="font-mono text-sm text-gray-400 dark:text-gray-500 italic">
        Match preview will appear here...
      </p>
      <pre
        v-else
        class="whitespace-pre-wrap break-words font-mono text-sm text-gray-800 dark:text-gray-200"
      ><!--
        --><template v-for="(seg, i) in segments" :key="i"><!--
          --><template v-if="seg.kind === 'text'">{{ seg.value }}</template><!--
          --><mark
              v-else
              class="relative rounded-sm px-px"
              :class="[
                seg.colorIndex === 0
                  ? 'bg-yellow-200 border-b-2 border-yellow-400 dark:bg-yellow-300/30 dark:border-yellow-500'
                  : 'bg-orange-200 border-b-2 border-orange-400 dark:bg-orange-300/30 dark:border-orange-500',
              ]"
            >{{ seg.value }}<sup
                class="pointer-events-none ml-px inline-block -translate-y-1 rounded bg-gray-700 px-1 text-[10px] leading-tight font-semibold text-white dark:bg-gray-600"
              >{{ seg.matchIndex }}</sup></mark><!--
      --></template></pre>
    </div>
  </div>
</template>
