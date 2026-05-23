import { TRPCClientError } from '@trpc/client'
import { describe, expect, it } from 'vitest'
import { isTRPCNotFoundError, shouldRetryTRPCQuery } from './trpc-client-errors'
import type { AppRouter } from '@/types/trpc'

type TestTRPCErrorCode = 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR'

function createTRPCError(code: TestTRPCErrorCode): TRPCClientError<AppRouter> {
  const httpStatus = code === 'NOT_FOUND' ? 404 : 500

  return new TRPCClientError<AppRouter>('Request failed', {
    result: {
      error: {
        message: 'Request failed',
        code: code === 'NOT_FOUND' ? -32004 : -32603,
        data: {
          code,
          httpStatus,
          path: 'test.procedure',
          zodError: null,
        },
      },
    },
  })
}

describe('tRPC client error helpers', () => {
  it('detects tRPC NOT_FOUND errors', () => {
    expect(isTRPCNotFoundError(createTRPCError('NOT_FOUND'))).toBe(true)
    expect(isTRPCNotFoundError(createTRPCError('INTERNAL_SERVER_ERROR'))).toBe(false)
    expect(isTRPCNotFoundError(new Error('plain error'))).toBe(false)
  })

  it('does not retry NOT_FOUND errors', () => {
    expect(shouldRetryTRPCQuery(0, createTRPCError('NOT_FOUND'))).toBe(false)
  })

  it('keeps the default three-attempt retry policy for retryable errors', () => {
    const error = createTRPCError('INTERNAL_SERVER_ERROR')

    expect(shouldRetryTRPCQuery(0, error)).toBe(true)
    expect(shouldRetryTRPCQuery(2, error)).toBe(true)
    expect(shouldRetryTRPCQuery(3, error)).toBe(false)
  })
})
