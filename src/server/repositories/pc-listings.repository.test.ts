import { describe, expect, it } from 'vitest'
import { ApprovalStatus, Prisma, Role } from '@orm'
import { buildPcListingListWhere, buildPendingPcListingsWhere } from './pc-listings.repository'

const USER_ID = 'user-123'

describe('PC listing repository query builders', () => {
  describe('buildPcListingListWhere', () => {
    it('includes approved and own pending PC listings for authenticated users', () => {
      const where = buildPcListingListWhere({
        userId: USER_ID,
        userRole: Role.USER,
        myListings: true,
      })

      expect(where).toMatchObject({
        authorId: USER_ID,
        OR: [
          { status: ApprovalStatus.APPROVED },
          { status: ApprovalStatus.PENDING, authorId: USER_ID },
        ],
        author: {
          OR: [
            { id: USER_ID },
            {
              userBans: {
                none: {
                  isActive: true,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
                },
              },
            },
          ],
        },
      })
    })

    it('limits requested pending PC listings to the requester for regular users', () => {
      const where = buildPcListingListWhere({
        userId: USER_ID,
        userRole: Role.USER,
        approvalStatus: ApprovalStatus.PENDING,
      })

      expect(where).toMatchObject({
        status: ApprovalStatus.PENDING,
        authorId: USER_ID,
      })
    })

    it('keeps search and authenticated visibility filters conjunctive', () => {
      const where = buildPcListingListWhere({
        userId: USER_ID,
        userRole: Role.USER,
        searchTerm: 'zelda',
      })

      expect(where).toMatchObject({
        AND: [
          {
            OR: expect.arrayContaining([
              {
                game: {
                  title: { contains: 'zelda', mode: Prisma.QueryMode.insensitive },
                  system: { key: { not: 'microsoft_windows' } },
                },
              },
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

    it('does not apply shadow-ban author filtering for moderators', () => {
      const where = buildPcListingListWhere({
        userId: USER_ID,
        userRole: Role.MODERATOR,
        approvalStatus: ApprovalStatus.PENDING,
        canSeeBannedUsers: true,
      })

      expect(where).toMatchObject({ status: ApprovalStatus.PENDING })
      expect(where).not.toHaveProperty('author')
    })

    it('filters out NSFW games unless explicitly enabled', () => {
      expect(buildPcListingListWhere({}).game).toMatchObject({ isErotic: false })
      expect(buildPcListingListWhere({ showNsfw: false }).game).toMatchObject({
        isErotic: false,
      })
      expect(buildPcListingListWhere({ showNsfw: true }).game).not.toHaveProperty('isErotic')
    })
  })

  describe('buildPendingPcListingsWhere', () => {
    it('does not apply shadow-ban author filtering to the approval queue query', () => {
      const where = buildPendingPcListingsWhere({
        emulatorIds: ['emulator-1'],
        search: 'zelda',
      })

      expect(where).toMatchObject({
        status: ApprovalStatus.PENDING,
        emulatorId: { in: ['emulator-1'] },
        OR: [
          { game: { title: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
          { cpu: { modelName: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
          { gpu: { modelName: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
          { emulator: { name: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
          { author: { name: { contains: 'zelda', mode: Prisma.QueryMode.insensitive } } },
        ],
      })
      expect(where).not.toHaveProperty('author')
    })

    it('ignores blank approval queue search values', () => {
      expect(buildPendingPcListingsWhere({ search: '   ' })).toEqual({
        status: ApprovalStatus.PENDING,
      })
    })
  })
})
