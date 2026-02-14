<script setup lang="ts">
import { ref } from 'vue'
import type { RegexMatch } from '../types/regex'

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
</script>

<template>
  <div class="flex flex-col rounded-lg border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <h2 class="text-sm font-semibold text-gray-700">
        Matches
        <span v-if="hasPattern" class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {{ matches.length }}
        </span>
      </h2>
    </div>

    <div class="max-h-96 overflow-y-auto">
      <div v-if="!hasPattern" class="px-4 py-8 text-center text-sm text-gray-400">
        Enter a pattern to see matches
      </div>

      <div v-else-if="matches.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
        No matches found
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li v-for="(match, i) in matches" :key="i" class="px-4 py-3">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <code class="inline-block rounded bg-yellow-100 px-1.5 py-0.5 font-mono text-sm text-gray-900 break-all">{{ match.value }}</code>
              <p class="mt-1 text-xs text-gray-400">
                index {{ match.index }}, length {{ match.length }}
              </p>

              <button
                v-if="match.groups.length > 0"
                type="button"
                @click="toggleGroups(i)"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
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
                  class="flex items-baseline gap-2 rounded bg-gray-50 px-2 py-1 text-xs"
                >
                  <span class="shrink-0 font-medium text-gray-500">
                    {{ group.name ?? `Group ${group.index}` }}
                  </span>
                  <code class="font-mono text-gray-800 break-all">{{ group.value }}</code>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
