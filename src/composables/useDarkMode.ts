import { ref, watch } from 'vue'

const isDark = ref(false)

function init() {
  const stored = localStorage.getItem('theme')
  if (stored) {
    isDark.value = stored === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  apply()
}

function apply() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

function toggle() {
  isDark.value = !isDark.value
}

watch(isDark, () => {
  apply()
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})

init()

export function useDarkMode() {
  return { isDark, toggle }
}
