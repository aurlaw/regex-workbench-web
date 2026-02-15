import { computed, type Ref } from 'vue'
import type { RegexFlags, DiffSegment } from '../types/regex'
import { type Result, success, failure } from '../types/result'
import { buildRegex } from './regexHelpers'

export function useRegexReplace(
  pattern: Ref<string>,
  flags: Ref<RegexFlags>,
  testText: Ref<string>,
  replacement: Ref<string>,
) {
  const resultText = computed<Result<string, string>>(() => {
    if (pattern.value === '' || testText.value === '') {
      return success(testText.value)
    }

    const regexResult = buildRegex(pattern.value, flags.value)
    if (regexResult.kind === 'failure') {
      return failure(regexResult.error)
    }

    return success(testText.value.replace(regexResult.value, replacement.value))
  })

  const diff = computed<Result<DiffSegment[], string>>(() => {
    if (pattern.value === '' || testText.value === '') {
      return success(testText.value ? [{ kind: 'unchanged', value: testText.value }] : [])
    }

    const regexResult = buildRegex(pattern.value, flags.value)
    if (regexResult.kind === 'failure') {
      return failure(regexResult.error)
    }

    const regex = regexResult.value
    const text = testText.value
    const segments: DiffSegment[] = []
    let lastIndex = 0

    // Use a fresh regex for iteration if global
    const iterRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g')
    let match: RegExpExecArray | null

    while ((match = iterRegex.exec(text)) !== null) {
      // Add unchanged text before this match
      if (match.index > lastIndex) {
        segments.push({ kind: 'unchanged', value: text.slice(lastIndex, match.index) })
      }

      const original = match[0]
      // Compute the replacement for this specific match using a single-match replace
      const singleRegex = new RegExp(regex.source, regex.flags.replace('g', ''))
      const replaced = original.replace(singleRegex, replacement.value)

      if (original !== replaced) {
        if (original) segments.push({ kind: 'removed', value: original })
        if (replaced) segments.push({ kind: 'added', value: replaced })
      } else {
        if (original) segments.push({ kind: 'unchanged', value: original })
      }

      lastIndex = match.index + original.length

      // Prevent infinite loop on zero-length matches
      if (original.length === 0) {
        if (iterRegex.lastIndex <= text.length) {
          const ch = text.charAt(iterRegex.lastIndex - 1)
          if (ch) segments.push({ kind: 'unchanged', value: ch })
          lastIndex = iterRegex.lastIndex
        } else {
          break
        }
      }

      // If the original regex isn't global, only process the first match
      if (!regex.flags.includes('g')) break
    }

    // Add remaining unchanged text
    if (lastIndex < text.length) {
      segments.push({ kind: 'unchanged', value: text.slice(lastIndex) })
    }

    return success(segments)
  })

  return { resultText, diff } as const
}
