import { describe, expect, it } from 'vitest'
import { isRetryableTransactionError } from './prisma-errors'

describe('isRetryableTransactionError', () => {
  it('accepts Prisma transaction conflicts', () => {
    expect(isRetryableTransactionError(Object.assign(new Error(), { code: 'P2034' }))).toBe(true)
  })

  it.each(['40001', '40P01'])('accepts raw PostgreSQL conflict %s', (originalCode) => {
    const error = Object.assign(new Error(), {
      code: 'P2010',
      meta: { driverAdapterError: { cause: { originalCode } } },
    })
    expect(isRetryableTransactionError(error)).toBe(true)
  })

  it.each([
    undefined,
    null,
    new Error('40001'),
    { code: 'P2034' },
    Object.assign(new Error(), { code: 'P2010' }),
    Object.assign(new Error(), { code: 'P2010', meta: null }),
    Object.assign(new Error(), { code: 'P2010', meta: { driverAdapterError: null } }),
    Object.assign(new Error(), {
      code: 'P2010',
      meta: { driverAdapterError: { cause: { originalCode: '23503' } } },
    }),
    Object.assign(new Error(), {
      code: 'P2010',
      meta: { driverAdapterError: { cause: { originalMessage: '40001' } } },
    }),
  ])('does not retry other or malformed errors (%#)', (error) => {
    expect(isRetryableTransactionError(error)).toBe(false)
  })
})
