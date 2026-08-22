import { describe, expect, it } from 'vitest'
import { ApprovalStatus, Prisma, Role } from '@orm'
import { ListingsRepository, type ListingFilters } from './listings.repository'

const FILTERS = {
  userId: 'user-123',
  userRole: Role.USER,
  search: 'zelda',
} satisfies ListingFilters

describe('handheld listing repository query builder', () => {
  it('keeps search and authenticated visibility filters conjunctive', () => {
    const where = ListingsRepository.buildListWhere(FILTERS)

    expect(where).toMatchObject({
      AND: [
        {
          OR: expect.arrayContaining([
            {
              game: {
                title: { contains: FILTERS.search, mode: Prisma.QueryMode.insensitive },
              },
            },
          ]),
        },
        {
          OR: [
            { status: ApprovalStatus.APPROVED },
            { status: ApprovalStatus.PENDING, authorId: FILTERS.userId },
          ],
        },
      ],
    })
    expect(where).not.toHaveProperty('OR')
  })
})
