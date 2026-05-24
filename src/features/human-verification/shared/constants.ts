export const HUMAN_VERIFICATION_ACTION = 'content_submission'
export const HUMAN_VERIFICATION_TOKEN_MAX_LENGTH = 2048

export const HUMAN_VERIFICATION_ERROR_CODES = {
  REQUIRED: 'HUMAN_VERIFICATION_REQUIRED',
  FAILED: 'HUMAN_VERIFICATION_FAILED',
  UNAVAILABLE: 'HUMAN_VERIFICATION_UNAVAILABLE',
} as const

export type HumanVerificationErrorCode =
  (typeof HUMAN_VERIFICATION_ERROR_CODES)[keyof typeof HUMAN_VERIFICATION_ERROR_CODES]

export interface HumanVerificationRequiredData {
  code: typeof HUMAN_VERIFICATION_ERROR_CODES.REQUIRED
  provider: 'turnstile'
  action: typeof HUMAN_VERIFICATION_ACTION
}
