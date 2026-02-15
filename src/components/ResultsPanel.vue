<script setup lang="ts">
import { ref } from 'vue'
import type { RegexMatch } from '../types/regex'
import { useClipboard } from '../composables/useClipboard'

defineProps<{
  matches: readonly RegexMatch[]
  hasPattern: boolean
}>()

const expandedGroups = ref<Set<number>>(new Set())

function toggleGroups(matchIndex: number) {
  const next = new Set(expandedGroups.value)
  if (next.has(matchIndex)) {
    next.delete(matchIndex)
  } else {
    next.add(matchIndex)
  }
  expandedGroups.value = next
}

const { copy: copyAll, justCopied: allCopied } = useClipboard()
const copiedIndex = ref<number | null>(null)
let matchTimer: ReturnType<typeof setTimeout> | undefined

function copyMatch(text: string, index: number) {
  navigator.clipboard.writeText(text)
  copiedIndex.value = index
  clearTimeout(matchTimer)
  matchTimer = setTimeout(() => {
    copiedIndex.value = null
  }, 1500)
}
</script>

<template>
  <div class="flex flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Matches
        <span v-if="hasPattern" class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {{ matches.length }}
        </span>
      </h2>
      <button
        v-if="matches.length > 0"
        type="button"
        @click="copyAll(matches.map(m => m.value).join('\n'))"
        class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="allCopied ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'"
      >
        <svg v-if="allCopied" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
        </svg>
        {{ allCopied ? 'Copied!' : 'Copy All' }}
      </button>
    </div>

    <div class="max-h-96 overflow-y-auto">
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="!hasPattern" key="no-pattern" class="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Enter a pattern to see matches
        </div>

        <div v-else-if="matches.length === 0" key="no-matches" class="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No matches found
        </div>

        <ul v-else key="matches" class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="(match, i) in matches" :key="i" class="px-4 py-3">
            <div class="flex items-start gap-3">
              <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {{ i + 1 }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <code class="inline-block rounded bg-yellow-100 px-1.5 py-0.5 font-mono text-sm text-gray-900 break-all dark:bg-yellow-300/20 dark:text-gray-100">{{ match.value }}</code>
                  <button
                    type="button"
                    title="Copy match"
                    @click="copyMatch(match.value, i)"
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-300 transition-colors hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
                  >
                    <svg v-if="copiedIndex === i" class="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  index {{ match.index }}, length {{ match.length }}
                </p>

                <button
                  v-if="match.groups.length > 0"
                  type="button"
                  @click="toggleGroups(i)"
                  class="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <svg
                    class="h-3.5 w-3.5 transition-transform"
                    :class="{ 'rotate-90': expandedGroups.has(i) }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                  {{ match.groups.length }} group{{ match.groups.length === 1 ? '' : 's' }}
                </button>

                <div v-if="expandedGroups.has(i)" class="mt-2 space-y-1">
                  <div
                    v-for="group in match.groups"
                    :key="group.index"
                    class="flex items-baseline gap-2 rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-700/50"
                  >
                    <span class="shrink-0 font-medium text-gray-500 dark:text-gray-400">
                      {{ group.name ?? `Group ${group.index}` }}
                    </span>
                    <code class="font-mono text-gray-800 break-all dark:text-gray-200">{{ group.value }}</code>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>
