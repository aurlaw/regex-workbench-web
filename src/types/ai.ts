import type { RegexFlags } from './regex'

export interface AiPatternResult {
  readonly pattern: string
  readonly explanation: string
  readonly suggestedFlags: RegexFlags
  readonly confidence: 'high' | 'medium' | 'low'
}

export interface RateLimitInfo {
  readonly remaining: number | null
  readonly limit: number | null
  readonly resetAt: string | null
}
