import { TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { describe, expect, it } from 'vitest'
import {
  HUMAN_VERIFICATION_ACTION,
  HUMAN_VERIFICATION_ERROR_CODES,
} from '@/features/human-verification/shared/constants'
import { APP_ERROR_CODES, AppError, ResourceError } from '@/lib/errors'
import { getSerializableAppError } from './app-error-cause'

function captureTrpcError(throwing: () => void): TRPCError {
  try {
    throwing()
  } catch (error) {
    if (error instanceof TRPCError) return error
    throw error
  }
  throw new Error('Expected the callback to throw a TRPCError')
}

function roundTripAppError(error: TRPCError): unknown {
  const errorData = { appError: getSerializableAppError(error.cause) }
  return superjson.deserialize<{ appError: unknown }>(superjson.serialize(errorData)).appError
}

describe('getSerializableAppError', () => {
  it('returns a plain-object copy of the structured cause', () => {
    const error = captureTrpcError(() => AppError.humanVerificationRequired())

    expect(getSerializableAppError(error.cause)).toEqual({
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: 'turnstile',
      action: HUMAN_VERIFICATION_ACTION,
    })
  })

  it('does not return an Error instance, so superjson cannot strip the custom fields', () => {
    const error = captureTrpcError(() => AppError.humanVerificationRequired())

    expect(getSerializableAppError(error.cause)).not.toBeInstanceOf(Error)
  })

  it('preserves human-verification fields through the superjson round-trip the tRPC transformer applies', () => {
    const error = captureTrpcError(() => AppError.humanVerificationRequired())

    expect(roundTripAppError(error)).toEqual({
      code: HUMAN_VERIFICATION_ERROR_CODES.REQUIRED,
      provider: 'turnstile',
      action: HUMAN_VERIFICATION_ACTION,
    })
  })

  it('preserves game-error metadata through the superjson round-trip', () => {
    const error = captureTrpcError(() =>
      ResourceError.game.alreadyExists('Tetris', 'Game Boy', 'game-123'),
    )

    expect(roundTripAppError(error)).toMatchObject({
      code: APP_ERROR_CODES.GAME_ALREADY_EXISTS,
      existingGameId: 'game-123',
    })
  })

  it('ignores causes that do not carry a structured app-error code', () => {
    expect(getSerializableAppError(new Error('boom'))).toBeNull()
    expect(getSerializableAppError(null)).toBeNull()
    expect(getSerializableAppError('nope')).toBeNull()
    expect(getSerializableAppError(42)).toBeNull()
  })
})
