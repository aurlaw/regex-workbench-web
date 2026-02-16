import { ref, computed, readonly } from 'vue'
import { useSupabase } from './useSupabase'
import { useAuth } from './useAuth'
import { success, failure, type Result } from '../types/result'
import type { AiPatternResult, RateLimitInfo } from '../types/ai'
import type { RegexFlags } from '../types/regex'

const isGenerating = ref(false)
const rateLimitInfo = ref<RateLimitInfo>({
  remaining: null,
  limit: null,
  resetAt: null,
})

function parseRateLimitHeaders(headers: Headers): void {
  const limit = headers.get('x-ratelimit-limit')
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')

  if (limit !== null || remaining !== null || reset !== null) {
    rateLimitInfo.value = {
      limit: limit !== null ? Number(limit) : rateLimitInfo.value.limit,
      remaining: remaining !== null ? Number(remaining) : rateLimitInfo.value.remaining,
      resetAt: reset ?? rateLimitInfo.value.resetAt,
    }
  }
}

interface EdgeFunctionResponse {
  pattern: string
  explanation: string
  flags: RegexFlags
  confidence: 'high' | 'medium' | 'low'
}

interface EdgeFunctionError {
  error: string
  message?: string
  resetAt?: string
}

export function useAiPatternBuilder() {
  const { supabase, isConfigured } = useSupabase()
  const { isAuthenticated } = useAuth()

  const isAvailable = computed(() => isConfigured.value && isAuthenticated.value)

  async function generatePattern(
    highlightedText: string,
    surroundingContext: string,
    intent?: string,
  ): Promise<Result<AiPatternResult, string>> {
    if (!supabase) {
      return failure('Supabase is not configured')
    }

    if (!isAuthenticated.value) {
      return failure('You must be signed in to use AI pattern generation')
    }

    isGenerating.value = true

    try {
      const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>(
        'generate-pattern',
        {
          body: { highlightedText, surroundingContext, intent },
        },
      )

      // supabase.functions.invoke returns the response headers via a workaround:
      // when the function returns a non-2xx status, error is a FunctionsHttpError
      // with the response accessible. We handle both paths.

      if (error) {
        // FunctionsHttpError has a context property with the response
        const response = (error as { context?: { response?: Response } }).context?.response
        if (response) {
          parseRateLimitHeaders(response.headers)

          if (response.status === 429) {
            const body: EdgeFunctionError = await response.json().catch(() => ({ error: 'Rate limit exceeded' }))
            rateLimitInfo.value = {
              ...rateLimitInfo.value,
              remaining: 0,
              resetAt: body.resetAt ?? rateLimitInfo.value.resetAt,
            }
            const resetMsg = body.resetAt
              ? ` Try again after ${new Date(body.resetAt).toLocaleTimeString()}.`
              : ''
            return failure(`Rate limit exceeded.${resetMsg}`)
          }

          if (response.status === 401) {
            return failure('Authentication expired. Please sign in again.')
          }
        }

        return failure(error.message || 'AI pattern generation failed')
      }

      if (!data || !data.pattern) {
        return failure('AI returned an empty or invalid response')
      }

      const result: AiPatternResult = {
        pattern: data.pattern,
        explanation: data.explanation,
        suggestedFlags: data.flags,
        confidence: data.confidence,
      }

      return success(result)
    } catch (err) {
      return failure(
        err instanceof Error ? err.message : 'Network error connecting to AI service',
      )
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generatePattern,
    isGenerating: readonly(isGenerating),
    rateLimitInfo: readonly(rateLimitInfo),
    isAvailable,
  }
}
