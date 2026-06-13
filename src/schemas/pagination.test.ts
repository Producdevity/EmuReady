import { describe, expect, it } from 'vitest'
import { LOOKUP_PAGINATION, PAGINATION } from '@/data/constants'
import { LookupPaginationInputSchema, PaginationInputSchema } from './pagination'

describe('PaginationInputSchema', () => {
  it('uses the shared pagination defaults', () => {
    expect(PaginationInputSchema.parse({})).toEqual({
      limit: PAGINATION.DEFAULT_LIMIT,
      offset: 0,
    })
  })

  it('rejects limits above the shared pagination maximum', () => {
    expect(() => PaginationInputSchema.parse({ limit: PAGINATION.MAX_LIMIT + 1 })).toThrow()
  })
})

describe('LookupPaginationInputSchema', () => {
  it('uses the shared lookup defaults', () => {
    expect(LookupPaginationInputSchema.parse({})).toEqual({
      limit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
      offset: 0,
    })
  })

  it('rejects limits above the shared lookup maximum', () => {
    expect(() =>
      LookupPaginationInputSchema.parse({ limit: LOOKUP_PAGINATION.MAX_LIMIT + 1 }),
    ).toThrow()
  })
})
