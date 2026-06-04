import { getAppErrorData } from '@/lib/trpc-client-errors'
import {
  HUMAN_VERIFICATION_ACTION,
  HUMAN_VERIFICATION_ERROR_CODES,
  type HumanVerificationRequiredData,
} from '../../shared/constants'

export function getHumanVerificationRequest(error: unknown): HumanVerificationRequiredData | null {
  const payload = getAppErrorData(error)
  if (!payload) return null

  if (
    payload.code === HUMAN_VERIFICATION_ERROR_CODES.REQUIRED &&
    payload.provider === 'turnstile' &&
    payload.action === HUMAN_VERIFICATION_ACTION
  ) {
    return {
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: 'turnstile',
      action: HUMAN_VERIFICATION_ACTION,
    }
  }

  return null
}
