import { TRPCClientError } from '@trpc/client'
import { describe, expect, it, vi } from 'vitest'
import { APP_ERROR_CODES } from '@/lib/errors'
import { handleGameCreationError } from './gameCreationErrors'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn() },
}))

function trpcClientError(appError: unknown): unknown {
  return TRPCClientError.from({
    error: { code: -32600, message: 'game error', data: { appError } },
  })
}

describe('handleGameCreationError', () => {
  it('detects a duplicate game with an existing id', () => {
    const error = trpcClientError({
      code: APP_ERROR_CODES.GAME_ALREADY_EXISTS,
      existingGameId: 'game-123',
    })

    expect(handleGameCreationError(error)).toEqual({
      type: 'duplicate',
      existingGameId: 'game-123',
    })
  })

  it('detects a duplicate game without an existing id', () => {
    const error = trpcClientError({ code: APP_ERROR_CODES.GAME_ALREADY_EXISTS })

    expect(handleGameCreationError(error)).toEqual({ type: 'duplicateNoId' })
  })

  it('detects a submission-limit error and surfaces reportsNeeded', () => {
    const error = trpcClientError({
      code: APP_ERROR_CODES.GAME_SUBMISSION_LIMIT_EXCEEDED,
      reportsNeeded: 3,
    })

    expect(handleGameCreationError(error)).toEqual({
      type: 'submissionLimit',
      reportsNeeded: 3,
    })
  })

  it('falls back to a generic result for unrecognized errors', () => {
    expect(handleGameCreationError(new Error('boom'))).toEqual({ type: 'generic' })
    expect(handleGameCreationError(trpcClientError({ code: 'SOMETHING_ELSE' }))).toEqual({
      type: 'generic',
    })
  })
})
