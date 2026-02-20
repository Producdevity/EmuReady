import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role, type PrismaClient } from '@orm'
import { SocialRepository } from './social.repository'

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

function createMockPrisma() {
  const mock = {
    userFollow: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    userRelationship: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    listing: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    pcListing: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: typeof mock) => Promise<unknown>) => fn(mock)),
  } as unknown as PrismaClient
  return mock
}

describe('SocialRepository', () => {
  let prisma: PrismaClient
  let repository: SocialRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new SocialRepository(prisma)
  })

  // ─── follow() ───────────────────────────────────────────────

  describe('follow', () => {
    it('should upsert a follow with correct composite key', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFollows: true },
      } as never)
      vi.mocked(prisma.userFollow.upsert).mockResolvedValueOnce({ id: 'f1' } as never)

      await repository.follow('me', 'target')

      expect(prisma.userFollow.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            followerId_followingId: { followerId: 'me', followingId: 'target' },
          },
          create: { followerId: 'me', followingId: 'target' },
          update: {},
        }),
      )
    })

    it('should throw cannotFollowSelf when IDs match', async () => {
      await expect(repository.follow('me', 'me')).rejects.toThrow('Cannot follow yourself')
    })

    it('should throw userBlocked when block relationship exists', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({ id: 'block1' } as never)

      await expect(repository.follow('me', 'target')).rejects.toThrow(
        'Cannot interact with this user',
      )
    })

    it('should throw user.notFound when target does not exist', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.follow('me', 'ghost')).rejects.toThrow('User not found')
    })

    it('should throw followsDisabled when target has allowFollows: false', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFollows: false },
      } as never)

      await expect(repository.follow('me', 'target')).rejects.toThrow(
        'This user does not accept new followers',
      )
    })

    it('should succeed when target has no settings (defaults to allowFollows: true)', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: null,
      } as never)
      vi.mocked(prisma.userFollow.upsert).mockResolvedValueOnce({ id: 'f1' } as never)

      await expect(repository.follow('me', 'target')).resolves.toBeDefined()
    })
  })

  // ─── unfollow() ─────────────────────────────────────────────

  describe('unfollow', () => {
    it('should call deleteMany with correct follower/following pair', async () => {
      vi.mocked(prisma.userFollow.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      await repository.unfollow('me', 'target')

      expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'me', followingId: 'target' },
      })
    })
  })

  // ─── removeFollower() ───────────────────────────────────────

  describe('removeFollower', () => {
    it('should call deleteMany with reversed direction', async () => {
      vi.mocked(prisma.userFollow.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      await repository.removeFollower('me', 'follower-1')

      expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'follower-1', followingId: 'me' },
      })
    })
  })

  // ─── getFollowers() ─────────────────────────────────────────

  describe('getFollowers', () => {
    it('should return paginated items for public profile', async () => {
      const items = [{ id: 'f1', createdAt: new Date(), follower: { id: 'u1' } }]
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(1)

      const result = await repository.getFollowers('user-1', 1, 10)

      expect(result.hidden).toBe(false)
      expect(result.items).toEqual(items)
      expect(result.pagination.total).toBe(1)
    })

    it('should return hidden when followersVisible: false for non-owner non-mod', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        settings: { followersVisible: false },
      } as never)

      const result = await repository.getFollowers('user-1', 1, 10, {
        requestingUserId: 'other-user',
        requestingUserRole: Role.USER,
      })

      expect(result.hidden).toBe(true)
      expect(result.items).toEqual([])
    })

    it('should return items when followersVisible: false but requester is owner', async () => {
      const items = [{ id: 'f1' }]
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(1)

      const result = await repository.getFollowers('user-1', 1, 10, {
        requestingUserId: 'user-1',
        requestingUserRole: Role.USER,
      })

      expect(result.hidden).toBe(false)
      expect(result.items).toEqual(items)
    })

    it('should return items when followersVisible: false but requester is MODERATOR', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      const items = [{ id: 'f1' }]
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(1)

      const result = await repository.getFollowers('user-1', 1, 10, {
        requestingUserId: 'mod-user',
        requestingUserRole: Role.MODERATOR,
      })

      expect(result.hidden).toBe(false)
      expect(result.items).toEqual(items)
    })

    it('should apply search filter to follower name', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(0)

      await repository.getFollowers('user-1', 1, 10, undefined, 'john')

      expect(prisma.userFollow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            followingId: 'user-1',
            follower: { name: { contains: 'john', mode: 'insensitive' } },
          }),
        }),
      )
    })

    it('should throw userBlocked when requester is blocked by target', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({ id: 'b1' } as never)

      await expect(
        repository.getFollowers('user-1', 1, 10, {
          requestingUserId: 'blocked-user',
          requestingUserRole: Role.USER,
        }),
      ).rejects.toThrow('Cannot interact with this user')
    })
  })

  // ─── getFollowing() ─────────────────────────────────────────

  describe('getFollowing', () => {
    it('should return paginated items for public profile', async () => {
      const items = [{ id: 'f1', createdAt: new Date(), following: { id: 'u1' } }]
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(1)

      const result = await repository.getFollowing('user-1', 1, 10)

      expect(result.hidden).toBe(false)
      expect(result.items).toEqual(items)
    })

    it('should return hidden when followingVisible: false for non-owner', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        settings: { followingVisible: false },
      } as never)

      const result = await repository.getFollowing('user-1', 1, 10, {
        requestingUserId: 'other-user',
        requestingUserRole: Role.USER,
      })

      expect(result.hidden).toBe(true)
      expect(result.items).toEqual([])
    })

    it('should return items when requester is owner despite followingVisible: false', async () => {
      const items = [{ id: 'f1' }]
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(1)

      const result = await repository.getFollowing('user-1', 1, 10, {
        requestingUserId: 'user-1',
        requestingUserRole: Role.USER,
      })

      expect(result.hidden).toBe(false)
      expect(result.items).toEqual(items)
    })
  })

  // ─── isFollowing() ──────────────────────────────────────────

  describe('isFollowing', () => {
    it('should return true when follow record exists', async () => {
      vi.mocked(prisma.userFollow.findUnique).mockResolvedValueOnce({ id: 'f1' } as never)

      const result = await repository.isFollowing('me', 'target')

      expect(result).toBe(true)
    })

    it('should return false when no record exists', async () => {
      vi.mocked(prisma.userFollow.findUnique).mockResolvedValueOnce(null)

      const result = await repository.isFollowing('me', 'target')

      expect(result).toBe(false)
    })
  })

  // ─── getBulkFollowStatuses() ────────────────────────────────

  describe('getBulkFollowStatuses', () => {
    it('should return a Record mapping each ID correctly', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([
        { followingId: 'a' },
        { followingId: 'c' },
      ] as never)

      const result = await repository.getBulkFollowStatuses('me', ['a', 'b', 'c'])

      expect(result).toEqual({ a: true, b: false, c: true })
    })
  })

  // ─── getFollowCounts() ─────────────────────────────────────

  describe('getFollowCounts', () => {
    it('should return followersCount and followingCount from two count queries', async () => {
      vi.mocked(prisma.userFollow.count).mockResolvedValueOnce(10).mockResolvedValueOnce(5)

      const result = await repository.getFollowCounts('user-1')

      expect(result).toEqual({ followersCount: 10, followingCount: 5 })
    })
  })

  // ─── sendFriendRequest() ────────────────────────────────────

  describe('sendFriendRequest', () => {
    it('should create with PENDING status and FRIEND type', async () => {
      vi.mocked(prisma.userRelationship.findFirst)
        .mockResolvedValueOnce(null) // assertNotBlocked
        .mockResolvedValueOnce(null) // existing check
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFriendRequests: true },
      } as never)
      vi.mocked(prisma.userRelationship.create).mockResolvedValueOnce({ id: 'r1' } as never)

      await repository.sendFriendRequest('me', 'target')

      expect(prisma.userRelationship.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          senderId: 'me',
          receiverId: 'target',
          type: 'FRIEND',
          status: 'PENDING',
        }),
      })
    })

    it('should throw cannotFriendSelf when IDs match', async () => {
      await expect(repository.sendFriendRequest('me', 'me')).rejects.toThrow(
        'Cannot send friend request to yourself',
      )
    })

    it('should throw userBlocked when block exists', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({ id: 'b1' } as never)

      await expect(repository.sendFriendRequest('me', 'target')).rejects.toThrow(
        'Cannot interact with this user',
      )
    })

    it('should throw user.notFound when target is missing', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.sendFriendRequest('me', 'ghost')).rejects.toThrow('User not found')
    })

    it('should throw friendRequestsDisabled when target has allowFriendRequests: false', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFriendRequests: false },
      } as never)

      await expect(repository.sendFriendRequest('me', 'target')).rejects.toThrow(
        'This user does not accept friend requests',
      )
    })

    it('should throw alreadyFriends when ACCEPTED relationship exists', async () => {
      vi.mocked(prisma.userRelationship.findFirst)
        .mockResolvedValueOnce(null) // assertNotBlocked
        .mockResolvedValueOnce({ id: 'r1', status: 'ACCEPTED' } as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFriendRequests: true },
      } as never)

      await expect(repository.sendFriendRequest('me', 'target')).rejects.toThrow(
        'Already friends with this user',
      )
    })

    it('should throw friendRequestPending when PENDING relationship exists', async () => {
      vi.mocked(prisma.userRelationship.findFirst)
        .mockResolvedValueOnce(null) // assertNotBlocked
        .mockResolvedValueOnce({ id: 'r1', status: 'PENDING' } as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target',
        settings: { allowFriendRequests: true },
      } as never)

      await expect(repository.sendFriendRequest('me', 'target')).rejects.toThrow(
        'Friend request already pending',
      )
    })
  })

  // ─── respondFriendRequest() ─────────────────────────────────

  describe('respondFriendRequest', () => {
    it('should update status to ACCEPTED when accepting', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce({
        id: 'r1',
        senderId: 'sender',
        receiverId: 'me',
        status: 'PENDING',
      } as never)
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null) // assertNotBlocked
      vi.mocked(prisma.userRelationship.update).mockResolvedValueOnce({ id: 'r1' } as never)

      await repository.respondFriendRequest('me', 'r1', true)

      expect(prisma.userRelationship.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'ACCEPTED' },
      })
    })

    it('should update status to DECLINED when declining', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce({
        id: 'r1',
        senderId: 'sender',
        receiverId: 'me',
        status: 'PENDING',
      } as never)
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.userRelationship.update).mockResolvedValueOnce({ id: 'r1' } as never)

      await repository.respondFriendRequest('me', 'r1', false)

      expect(prisma.userRelationship.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'DECLINED' },
      })
    })

    it('should throw friendRequestNotFound when request does not exist', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce(null)

      await expect(repository.respondFriendRequest('me', 'r-missing', true)).rejects.toThrow(
        'Friend request not found',
      )
    })

    it('should throw canOnlyRespondToOwnRequests when receiver does not match', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce({
        id: 'r1',
        senderId: 'sender',
        receiverId: 'someone-else',
        status: 'PENDING',
      } as never)

      await expect(repository.respondFriendRequest('me', 'r1', true)).rejects.toThrow(
        'You can only respond to requests sent to you',
      )
    })

    it('should throw requestAlreadyResponded when status is not PENDING', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce({
        id: 'r1',
        senderId: 'sender',
        receiverId: 'me',
        status: 'ACCEPTED',
      } as never)

      await expect(repository.respondFriendRequest('me', 'r1', true)).rejects.toThrow(
        'This request has already been responded to',
      )
    })

    it('should throw userBlocked when sender is blocked', async () => {
      vi.mocked(prisma.userRelationship.findUnique).mockResolvedValueOnce({
        id: 'r1',
        senderId: 'sender',
        receiverId: 'me',
        status: 'PENDING',
      } as never)
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({ id: 'b1' } as never)

      await expect(repository.respondFriendRequest('me', 'r1', true)).rejects.toThrow(
        'Cannot interact with this user',
      )
    })
  })

  // ─── getRelationshipStatus() ────────────────────────────────

  describe('getRelationshipStatus', () => {
    it('should return isFriend: true for ACCEPTED relationship', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({
        id: 'r1',
        status: 'ACCEPTED',
        senderId: 'me',
      } as never)

      const result = await repository.getRelationshipStatus('me', 'target')

      expect(result).toEqual({ isFriend: true, pendingRequest: null })
    })

    it('should return pendingRequest with direction: sent for PENDING sent by current user', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({
        id: 'r1',
        status: 'PENDING',
        senderId: 'me',
      } as never)

      const result = await repository.getRelationshipStatus('me', 'target')

      expect(result).toEqual({
        isFriend: false,
        pendingRequest: { id: 'r1', direction: 'sent' },
      })
    })

    it('should return pendingRequest with direction: received for PENDING sent by other', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce({
        id: 'r1',
        status: 'PENDING',
        senderId: 'target',
      } as never)

      const result = await repository.getRelationshipStatus('me', 'target')

      expect(result).toEqual({
        isFriend: false,
        pendingRequest: { id: 'r1', direction: 'received' },
      })
    })

    it('should return isFriend: false and pendingRequest: null when no relationship', async () => {
      vi.mocked(prisma.userRelationship.findFirst).mockResolvedValueOnce(null)

      const result = await repository.getRelationshipStatus('me', 'target')

      expect(result).toEqual({ isFriend: false, pendingRequest: null })
    })
  })

  // ─── blockUser() ────────────────────────────────────────────

  describe('blockUser', () => {
    it('should use $transaction to delete non-blocked relationships, follows, and upsert block', async () => {
      vi.mocked(prisma.userRelationship.deleteMany).mockResolvedValueOnce({ count: 1 } as never)
      vi.mocked(prisma.userFollow.deleteMany).mockResolvedValueOnce({ count: 2 } as never)
      vi.mocked(prisma.userRelationship.upsert).mockResolvedValueOnce({ id: 'b1' } as never)

      await repository.blockUser('me', 'target')

      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userRelationship.deleteMany).toHaveBeenCalledWith({
        where: {
          status: { not: 'BLOCKED' },
          OR: [
            { senderId: 'me', receiverId: 'target' },
            { senderId: 'target', receiverId: 'me' },
          ],
        },
      })
      expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { followerId: 'me', followingId: 'target' },
            { followerId: 'target', followingId: 'me' },
          ],
        },
      })
      expect(prisma.userRelationship.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            senderId_receiverId_type: {
              senderId: 'me',
              receiverId: 'target',
              type: 'FRIEND',
            },
          },
          create: expect.objectContaining({ status: 'BLOCKED' }),
          update: { status: 'BLOCKED' },
        }),
      )
    })

    it('should throw cannotBlockSelf when IDs match', async () => {
      await expect(repository.blockUser('me', 'me')).rejects.toThrow('Cannot block yourself')
    })
  })

  // ─── unblockUser() ──────────────────────────────────────────

  describe('unblockUser', () => {
    it('should call deleteMany with BLOCKED status filter', async () => {
      vi.mocked(prisma.userRelationship.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      await repository.unblockUser('me', 'target')

      expect(prisma.userRelationship.deleteMany).toHaveBeenCalledWith({
        where: {
          senderId: 'me',
          receiverId: 'target',
          status: 'BLOCKED',
        },
      })
    })
  })

  // ─── getActivityFeed() ──────────────────────────────────────

  describe('getActivityFeed', () => {
    const now = new Date('2026-02-19T12:00:00Z')
    const earlier = new Date('2026-02-19T11:00:00Z')

    it('should merge and sort listings + pcListings by createdAt desc', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([{ followingId: 'u1' }] as never)
      vi.mocked(prisma.userRelationship.findMany).mockResolvedValueOnce([])

      const listing = { id: 'l1', createdAt: earlier }
      const pcListing = { id: 'pc1', createdAt: now }
      vi.mocked(prisma.listing.findMany).mockResolvedValueOnce([listing] as never)
      vi.mocked(prisma.pcListing.findMany).mockResolvedValueOnce([pcListing] as never)
      vi.mocked(prisma.listing.count).mockResolvedValueOnce(1)
      vi.mocked(prisma.pcListing.count).mockResolvedValueOnce(1)

      const result = await repository.getActivityFeed('me', 1, 10)

      expect(result.items[0]).toEqual({ type: 'pcListing', data: pcListing })
      expect(result.items[1]).toEqual({ type: 'listing', data: listing })
      expect(result.pagination.total).toBe(2)
    })

    it('should return empty when scope: following and user follows nobody', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([])

      const result = await repository.getActivityFeed('me', 1, 10, { scope: 'following' })

      expect(result.items).toEqual([])
      expect(result.pagination.total).toBe(0)
    })

    it('should exclude blocked users from results', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([
        { followingId: 'u1' },
        { followingId: 'blocked-user' },
      ] as never)
      vi.mocked(prisma.userRelationship.findMany).mockResolvedValueOnce([
        { senderId: 'me', receiverId: 'blocked-user' },
      ] as never)
      vi.mocked(prisma.listing.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.pcListing.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.listing.count).mockResolvedValueOnce(0)
      vi.mocked(prisma.pcListing.count).mockResolvedValueOnce(0)

      await repository.getActivityFeed('me', 1, 10)

      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: { notIn: ['blocked-user'] },
          }),
        }),
      )
    })

    it('should filter by type: listing (no pcListings fetched)', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([{ followingId: 'u1' }] as never)
      vi.mocked(prisma.userRelationship.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.listing.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.listing.count).mockResolvedValueOnce(0)

      const result = await repository.getActivityFeed('me', 1, 10, { type: 'listing' })

      expect(prisma.pcListing.findMany).not.toHaveBeenCalled()
      expect(result.items).toEqual([])
    })

    it('should filter by type: pcListing (no listings fetched)', async () => {
      vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([{ followingId: 'u1' }] as never)
      vi.mocked(prisma.userRelationship.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.pcListing.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.pcListing.count).mockResolvedValueOnce(0)

      const result = await repository.getActivityFeed('me', 1, 10, { type: 'pcListing' })

      expect(prisma.listing.findMany).not.toHaveBeenCalled()
      expect(result.items).toEqual([])
    })
  })
})
