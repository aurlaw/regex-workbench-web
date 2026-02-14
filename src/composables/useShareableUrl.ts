import { watch, type Ref } from 'vue'
import type { RegexFlags } from '../types/regex'

const FLAG_KEYS: (keyof RegexFlags)[] = [
  'global',
  'caseInsensitive',
  'multiline',
  'dotAll',
  'unicode',
]

const FLAG_CHARS: Record<keyof RegexFlags, string> = {
  global: 'g',
  caseInsensitive: 'i',
  multiline: 'm',
  dotAll: 's',
  unicode: 'u',
}

const CHAR_TO_FLAG: Record<string, keyof RegexFlags> = Object.fromEntries(
  Object.entries(FLAG_CHARS).map(([k, v]) => [v, k as keyof RegexFlags]),
)

function toBase64(str: string): string {
  return btoa(
    new TextEncoder()
      .encode(str)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), ''),
  )
}

function fromBase64(b64: string): string {
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeFlagsString(flags: RegexFlags): string {
  return FLAG_KEYS.filter((k) => flags[k]).map((k) => FLAG_CHARS[k]).join('')
}

function decodeFlagsString(str: string): RegexFlags {
  const flags: RegexFlags = {
    global: false,
    caseInsensitive: false,
    multiline: false,
    dotAll: false,
    unicode: false,
  }
  for (const ch of str) {
    const key = CHAR_TO_FLAG[ch]
    if (key) (flags as unknown as Record<string, boolean>)[key] = true
  }
  return flags
}

export interface UrlState {
  pattern: string
  flags: RegexFlags
  testText: string
}

export function parseUrlState(): UrlState | null {
  const params = new URLSearchParams(window.location.search)
  const p = params.get('p')
  if (p == null) return null

  try {
    return {
      pattern: fromBase64(p),
      flags: decodeFlagsString(params.get('f') ?? 'g'),
      testText: fromBase64(params.get('t') ?? ''),
    }
  } catch {
    return null
  }
}

export function useShareableUrl(
  pattern: Ref<string>,
  flags: Ref<RegexFlags>,
  testText: Ref<string>,
) {
  let timer: ReturnType<typeof setTimeout> | undefined

  function updateUrl() {
    const params = new URLSearchParams()
    if (pattern.value) params.set('p', toBase64(pattern.value))
    if (pattern.value) params.set('f', encodeFlagsString(flags.value))
    if (testText.value) params.set('t', toBase64(testText.value))

    const qs = params.toString()
    const url = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname
    history.replaceState(null, '', url)
  }

  watch([pattern, flags, testText], () => {
    clearTimeout(timer)
    timer = setTimeout(updateUrl, 500)
  })

  return {
    getShareUrl(): string {
      // Flush any pending debounced update so the URL is current
      clearTimeout(timer)
      updateUrl()
      return window.location.href
    },
  }
}
