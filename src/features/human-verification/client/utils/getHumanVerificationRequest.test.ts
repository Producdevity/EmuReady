import { TRPCClientError } from '@trpc/client'
import { describe, expect, it } from 'vitest'
import { getHumanVerificationRequest } from './getHumanVerificationRequest'
import { HUMAN_VERIFICATION_ACTION, HUMAN_VERIFICATION_ERROR_CODES } from '../../shared/constants'

function trpcClientError(data: unknown): unknown {
  return TRPCClientError.from({ error: { code: -32600, message: 'verification', data } })
}

describe('getHumanVerificationRequest', () => {
  it('extracts the challenge request from a tRPC client error carrying the verification app error', () => {
    const error = trpcClientError({
      appError: {
        code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
        provider: 'turnstile',
        action: HUMAN_VERIFICATION_ACTION,
      },
    })

    expect(getHumanVerificationRequest(error)).toEqual({
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: 'turnstile',
      action: HUMAN_VERIFICATION_ACTION,
    })
  })

  it('ignores a tRPC client error carrying a different app error', () => {
    const error = trpcClientError({ appError: { code: 'GAME_ALREADY_EXISTS' } })

    expect(getHumanVerificationRequest(error)).toBeNull()
  })

  it('ignores tRPC client errors with no app-error payload', () => {
    expect(getHumanVerificationRequest(trpcClientError({ appError: null }))).toBeNull()
    expect(getHumanVerificationRequest(trpcClientError({}))).toBeNull()
  })

  it('ignores errors that are not tRPC client errors', () => {
    expect(getHumanVerificationRequest(new Error('nope'))).toBeNull()
    expect(getHumanVerificationRequest(null)).toBeNull()
  })
})
