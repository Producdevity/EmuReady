import { describe, expect, it } from 'vitest'
import {
  GetListingBookmarksSchema,
  GetPcListingBookmarksSchema,
} from '@/features/bookmarks/shared/bookmark.schemas'

describe('bookmark filter input', () => {
  const userId = '00000000-0000-4000-a000-000000000001'
  it('keeps existing callers valid with the original date ordering', () => {
    expect(GetListingBookmarksSchema.parse({ userId })).toMatchObject({
      sortField: 'savedAt',
      sortDirection: 'desc',
      systemIds: [],
      deviceIds: [],
    })
  })
  it.each([
    { systemIds: ['invalid'] },
    { deviceIds: Array.from({ length: 51 }, () => userId) },
    { performanceIds: [0] },
    { sortField: 'rawSQL' },
    { sortDirection: 'invalid' },
  ])('rejects invalid filters: %j', (filters) => {
    expect(GetListingBookmarksSchema.safeParse({ userId, ...filters }).success).toBe(false)
  })
  it.each([GetListingBookmarksSchema, GetPcListingBookmarksSchema])(
    'rejects inverted memory ranges at the list boundary',
    (schema) => {
      const result = schema.safeParse({ userId, memoryMin: 32, memoryMax: 16 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([expect.objectContaining({ path: ['memoryMax'] })]),
        )
      }
      for (const range of [
        { memoryMin: 16, memoryMax: 16 },
        { memoryMin: null, memoryMax: 16 },
        { memoryMin: 32, memoryMax: null },
      ]) {
        expect(schema.safeParse({ userId, ...range }).success).toBe(true)
      }
    },
  )
})
