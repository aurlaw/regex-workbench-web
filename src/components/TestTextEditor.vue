<script setup lang="ts">
import { computed } from 'vue'
import type { RegexMatch } from '../types/regex'

type Segment =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'match'; readonly value: string; readonly matchIndex: number; readonly colorIndex: number }

const props = defineProps<{
  modelValue: string
  matches: readonly RegexMatch[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

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

    // Skip matches that start before our cursor (overlapping)
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
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      placeholder="Enter test text..."
      spellcheck="false"
      rows="6"
      class="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
    />

    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p v-if="modelValue === ''" class="font-mono text-sm text-gray-400 italic">
        Match preview will appear here...
      </p>
      <pre
        v-else
        class="whitespace-pre-wrap break-words font-mono text-sm text-gray-800"
      ><!--
        --><template v-for="(seg, i) in segments" :key="i"><!--
          --><template v-if="seg.kind === 'text'">{{ seg.value }}</template><!--
          --><mark
              v-else
              class="relative rounded-sm px-px"
              :class="[
                seg.colorIndex === 0
                  ? 'bg-yellow-200 border-b-2 border-yellow-400'
                  : 'bg-orange-200 border-b-2 border-orange-400',
              ]"
            >{{ seg.value }}<sup
                class="pointer-events-none ml-px inline-block -translate-y-1 rounded bg-gray-700 px-1 text-[10px] leading-tight font-semibold text-white"
              >{{ seg.matchIndex }}</sup></mark><!--
      --></template></pre>
    </div>
  </div>
</template>
