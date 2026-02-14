import { ref } from 'vue'

export function useClipboard(feedbackMs = 1500) {
  const justCopied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    justCopied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      justCopied.value = false
    }, feedbackMs)
  }

  return { copy, justCopied }
}
