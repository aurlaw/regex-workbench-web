export interface RegexGroup {
  readonly name: string | null
  readonly value: string
  readonly index: number
}

export interface RegexMatch {
  readonly index: number
  readonly length: number
  readonly value: string
  readonly groups: readonly RegexGroup[]
}

export interface RegexValidation {
  readonly isValid: boolean
  readonly error?: string
}

export interface RegexFlags {
  readonly global: boolean
  readonly caseInsensitive: boolean
  readonly multiline: boolean
  readonly dotAll: boolean
  readonly unicode: boolean
}
