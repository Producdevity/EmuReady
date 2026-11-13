import { describe, expect, it } from 'vitest'
import { GetListingBookmarksSchema } from '@/features/bookmarks/shared/bookmark.schemas'

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
})
