import type { RegexFlags } from '../types/regex'
import { type Result, success, failure } from '../types/result'

export function buildFlagString(flags: RegexFlags): string {
  let s = ''
  if (flags.global) s += 'g'
  if (flags.caseInsensitive) s += 'i'
  if (flags.multiline) s += 'm'
  if (flags.dotAll) s += 's'
  if (flags.unicode) s += 'u'
  return s
}

export function buildRegex(pattern: string, flags: RegexFlags): Result<RegExp, string> {
  try {
    return success(new RegExp(pattern, buildFlagString(flags)))
  } catch (e) {
    return failure(e instanceof Error ? e.message : String(e))
  }
}
