export type Result<T, E> =
  | { readonly kind: 'success'; readonly value: T }
  | { readonly kind: 'failure'; readonly error: E }

export function success<T>(value: T): Result<T, never> {
  return { kind: 'success', value }
}

export function failure<E>(error: E): Result<never, E> {
  return { kind: 'failure', error }
}

export function isSuccess<T, E>(result: Result<T, E>): result is { readonly kind: 'success'; readonly value: T } {
  return result.kind === 'success'
}

export function isFailure<T, E>(result: Result<T, E>): result is { readonly kind: 'failure'; readonly error: E } {
  return result.kind === 'failure'
}
