import { describe, expect, it } from 'vitest'
import { getHumanVerificationRequest } from './getHumanVerificationRequest'
import { HUMAN_VERIFICATION_ACTION, HUMAN_VERIFICATION_ERROR_CODES } from '../../shared/constants'

describe('getHumanVerificationRequest', () => {
  it('extracts the challenge request from tRPC app error data', () => {
    expect(
      getHumanVerificationRequest({
        data: {
          appError: {
            code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
            provider: 'turnstile',
            action: HUMAN_VERIFICATION_ACTION,
          },
        },
      }),
    ).toEqual({
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: 'turnstile',
      action: HUMAN_VERIFICATION_ACTION,
    })
  })

  it('ignores non-challenge errors', () => {
    expect(getHumanVerificationRequest(new Error('nope'))).toBeNull()
  })
})
