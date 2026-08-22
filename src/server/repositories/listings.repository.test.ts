import { describe, expect, it } from 'vitest'
import { ApprovalStatus, Prisma, Role } from '@orm'
import { ListingsRepository } from './listings.repository'

const USER_ID = 'user-123'

describe('handheld listing repository query builder', () => {
  it('keeps search and authenticated visibility filters conjunctive', () => {
    const where = ListingsRepository.buildListWhere({
      userId: USER_ID,
      userRole: Role.USER,
      search: 'zelda',
    })

    expect(where).toMatchObject({
      AND: [
        {
          OR: expect.arrayContaining([
            { game: { title: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
          ]),
        },
        {
          OR: [
            { status: ApprovalStatus.APPROVED },
            { status: ApprovalStatus.PENDING, authorId: USER_ID },
          ],
        },
      ],
    })
    expect(where).not.toHaveProperty('OR')
  })
})
