<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const popoverRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (
    open.value &&
    popoverRef.value &&
    !popoverRef.value.contains(e.target as Node) &&
    buttonRef.value &&
    !buttonRef.value.contains(e.target as Node)
  ) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="relative">
    <button
      ref="buttonRef"
      type="button"
      title="Keyboard shortcuts"
      @click="toggle"
      class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
    </button>
    <div
      v-if="open"
      ref="popoverRef"
      class="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Keyboard Shortcuts</h3>
      <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
        <li class="flex items-center justify-between">
          <span>Focus pattern</span>
          <kbd class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700">Ctrl+L</kbd>
        </li>
        <li class="flex items-center justify-between">
          <span>Focus test text</span>
          <kbd class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700">Ctrl+T</kbd>
        </li>
        <li class="flex items-center justify-between">
          <span>Blur focus</span>
          <kbd class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700">Escape</kbd>
        </li>
      </ul>
    </div>
  </div>
</template>
