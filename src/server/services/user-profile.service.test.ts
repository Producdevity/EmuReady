import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role, type PrismaClient } from '@orm'
import { checkProfileAccess, PRIVATE_PROFILE_SETTINGS } from './user-profile.service'

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient
}

describe('user-profile.service', () => {
  let prisma: PrismaClient

  beforeEach(() => {
    prisma = createMockPrisma()
  })

  describe('PRIVATE_PROFILE_SETTINGS', () => {
    it('should have all fields set to false', () => {
      expect(PRIVATE_PROFILE_SETTINGS).toEqual({
        profilePublic: false,
        showVotingActivity: false,
        allowFollows: false,
        allowFriendRequests: false,
        followersVisible: false,
        followingVisible: false,
      })
    })
  })

  describe('checkProfileAccess', () => {
    it('should return not_found when user is null', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await checkProfileAccess(prisma, 'missing-id', {})

      expect(result).toEqual({ accessible: false, reason: 'not_found' })
    })

    it('should return banned when user has active ban and viewer is not mod', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'banned-user',
        userBans: [{ id: 'ban-1' }],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'banned-user', {
        currentUserRole: Role.USER,
      })

      expect(result).toEqual({ accessible: false, reason: 'banned' })
    })

    it('should return accessible with isBanned when user has active ban but viewer is MODERATOR', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'banned-user',
        userBans: [{ id: 'ban-1' }],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'banned-user', {
        currentUserRole: Role.MODERATOR,
      })

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.isBanned).toBe(true)
        expect(result.isMod).toBe(true)
      }
    })

    it('should return private when profilePublic: false and viewer is not owner/mod', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'private-user',
        userBans: [],
        settings: { profilePublic: false },
      } as never)

      const result = await checkProfileAccess(prisma, 'private-user', {
        currentUserId: 'other-user',
        currentUserRole: Role.USER,
      })

      expect(result).toEqual({ accessible: false, reason: 'private' })
    })

    it('should return accessible when profile is private but viewer is the owner', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'private-user',
        userBans: [],
        settings: { profilePublic: false },
      } as never)

      const result = await checkProfileAccess(prisma, 'private-user', {
        currentUserId: 'private-user',
        currentUserRole: Role.USER,
      })

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.isOwner).toBe(true)
      }
    })

    it('should return accessible when profile is private but viewer is MODERATOR', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'private-user',
        userBans: [],
        settings: { profilePublic: false },
      } as never)

      const result = await checkProfileAccess(prisma, 'private-user', {
        currentUserId: 'mod-user',
        currentUserRole: Role.MODERATOR,
      })

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.isMod).toBe(true)
      }
    })

    it('should hydrate privacy settings from user.settings', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        userBans: [],
        settings: {
          profilePublic: true,
          showVotingActivity: false,
          allowFollows: false,
          allowFriendRequests: true,
          followersVisible: false,
          followingVisible: true,
        },
      } as never)

      const result = await checkProfileAccess(prisma, 'user-1', {})

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.privacySettings).toEqual({
          profilePublic: true,
          showVotingActivity: false,
          allowFollows: false,
          allowFriendRequests: true,
          followersVisible: false,
          followingVisible: true,
        })
      }
    })

    it('should default all privacy settings to true when user.settings is null', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        userBans: [],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'user-1', {})

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.privacySettings).toEqual({
          profilePublic: true,
          showVotingActivity: true,
          allowFollows: true,
          allowFriendRequests: true,
          followersVisible: true,
          followingVisible: true,
        })
      }
    })

    it('should set showNsfw from ctx when true', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        userBans: [],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'user-1', { showNsfw: true })

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.showNsfw).toBe(true)
      }
    })

    it('should set showNsfw to false when ctx.showNsfw is undefined', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        userBans: [],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'user-1', {})

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.showNsfw).toBe(false)
      }
    })

    it('should set canViewBannedUsers true for MODERATOR, false for USER', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: 'u1', userBans: [], settings: null } as never)
        .mockResolvedValueOnce({ id: 'u1', userBans: [], settings: null } as never)

      const modResult = await checkProfileAccess(prisma, 'u1', {
        currentUserRole: Role.MODERATOR,
      })
      const userResult = await checkProfileAccess(prisma, 'u1', {
        currentUserRole: Role.USER,
      })

      expect(modResult.accessible && modResult.canViewBannedUsers).toBe(true)
      expect(userResult.accessible && userResult.canViewBannedUsers).toBe(false)
    })

    it('should set isOwner true when currentUserId matches targetUserId', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        userBans: [],
        settings: null,
      } as never)

      const result = await checkProfileAccess(prisma, 'user-1', {
        currentUserId: 'user-1',
      })

      expect(result.accessible).toBe(true)
      if (result.accessible) {
        expect(result.isOwner).toBe(true)
      }
    })
  })
})
