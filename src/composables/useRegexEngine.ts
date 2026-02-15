import { computed, type Ref } from 'vue'
import type { RegexFlags, RegexGroup, RegexMatch, RegexValidation } from '../types/regex'
import { type Result, success, failure } from '../types/result'
import { buildRegex } from './regexHelpers'

function extractGroups(match: RegExpMatchArray): RegexGroup[] {
  const groups: RegexGroup[] = []
  const named = match.groups ?? {}
  const namedValues = new Map<number, string>()

  // Map named groups to their capturing group indices by matching values/positions
  for (const [name, value] of Object.entries(named)) {
    if (value === undefined) continue
    for (let i = 1; i < match.length; i++) {
      if (match[i] === value && !namedValues.has(i)) {
        namedValues.set(i, name)
        break
      }
    }
  }

  for (let i = 1; i < match.length; i++) {
    const value = match[i]
    if (value === undefined) continue
    groups.push({
      name: namedValues.get(i) ?? null,
      value,
      index: i,
    })
  }

  return groups
}

export function useRegexEngine(
  pattern: Ref<string>,
  testText: Ref<string>,
  flags: Ref<RegexFlags>,
) {
  const validation = computed<Result<RegexValidation, string>>(() => {
    if (pattern.value === '') {
      return success({ isValid: true })
    }

    const result = buildRegex(pattern.value, flags.value)
    if (result.kind === 'failure') {
      return success({ isValid: false, error: result.error })
    }

    return success({ isValid: true })
  })

  const matches = computed<Result<RegexMatch[], string>>(() => {
    if (pattern.value === '' || testText.value === '') {
      return success([])
    }

    const regexResult = buildRegex(pattern.value, flags.value)
    if (regexResult.kind === 'failure') {
      return failure(regexResult.error)
    }

    const regex = regexResult.value
    const results: RegexMatch[] = []

    if (flags.value.global) {
      let match: RegExpExecArray | null
      while ((match = regex.exec(testText.value)) !== null) {
        results.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
          groups: extractGroups(match),
        })
        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++
        }
      }
    } else {
      const match = regex.exec(testText.value)
      if (match) {
        results.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
          groups: extractGroups(match),
        })
      }
    }

    return success(results)
  })

  return { validation, matches } as const
}
