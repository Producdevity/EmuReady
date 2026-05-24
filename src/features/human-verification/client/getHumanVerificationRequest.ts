import {
  HUMAN_VERIFICATION_ACTION,
  HUMAN_VERIFICATION_ERROR_CODES,
  type HumanVerificationRequiredData,
} from '../shared/constants'

function getErrorPayload(error: unknown): unknown {
  if (!error || typeof error !== 'object') return null

  const candidate = error as {
    cause?: unknown
    data?: { appError?: unknown; cause?: unknown }
  }

  return candidate.data?.appError ?? candidate.data?.cause ?? candidate.cause ?? null
}

export function getHumanVerificationRequest(error: unknown): HumanVerificationRequiredData | null {
  const payload = getErrorPayload(error)
  if (!payload || typeof payload !== 'object') return null

  const data = payload as Partial<HumanVerificationRequiredData>
  if (
    data.code === HUMAN_VERIFICATION_ERROR_CODES.REQUIRED &&
    data.provider === 'turnstile' &&
    data.action === HUMAN_VERIFICATION_ACTION
  ) {
    return {
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: data.provider,
      action: data.action,
    }
  }

  return null
}
