import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'
import type { PrismaClient } from '@orm'

interface ProfileAccessContext {
  currentUserId?: string
  currentUserRole?: Role
  showNsfw?: boolean
}

interface PrivacySettings {
  profilePublic: boolean
  showVotingActivity: boolean
  allowFollows: boolean
  allowFriendRequests: boolean
  followersVisible: boolean
  followingVisible: boolean
}

interface AccessibleProfile {
  accessible: true
  isBanned: boolean
  canViewBannedUsers: boolean
  isOwner: boolean
  isMod: boolean
  showNsfw: boolean
  privacySettings: PrivacySettings
}

interface InaccessibleProfile {
  accessible: false
  reason: 'not_found' | 'banned' | 'private' // TODO: use constants or enums
}

export type ProfileAccessResult = AccessibleProfile | InaccessibleProfile

/** Default privacy settings returned for limited-profile responses */
export const PRIVATE_PROFILE_SETTINGS: PrivacySettings = {
  profilePublic: false,
  showVotingActivity: false,
  allowFollows: false,
  allowFriendRequests: false,
  followersVisible: false,
  followingVisible: false,
}

/**
 * Checks ban status + privacy settings for a user profile in a single query.
 * Encapsulates the shared logic used by both web and mobile user profile endpoints.
 */
export async function checkProfileAccess(
  prisma: PrismaClient,
  targetUserId: string,
  ctx: ProfileAccessContext,
): Promise<ProfileAccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      userBans: {
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      },
      settings: {
        select: {
          profilePublic: true,
          showVotingActivity: true,
          allowFollows: true,
          allowFriendRequests: true,
          followersVisible: true,
          followingVisible: true,
        },
      },
    },
  })

  if (!user) return { accessible: false, reason: 'not_found' }

  const isBanned = user.userBans.length > 0
  const canViewBannedUsers = roleIncludesRole(ctx.currentUserRole, Role.MODERATOR)
  const isOwner = ctx.currentUserId === targetUserId
  const isMod = canViewBannedUsers

  if (isBanned && !canViewBannedUsers) {
    return { accessible: false, reason: 'banned' }
  }

  const privacySettings: PrivacySettings = {
    profilePublic: user.settings?.profilePublic ?? true,
    showVotingActivity: user.settings?.showVotingActivity ?? true,
    allowFollows: user.settings?.allowFollows ?? true,
    allowFriendRequests: user.settings?.allowFriendRequests ?? true,
    followersVisible: user.settings?.followersVisible ?? true,
    followingVisible: user.settings?.followingVisible ?? true,
  }

  if (!privacySettings.profilePublic && !isOwner && !isMod) {
    return { accessible: false, reason: 'private' }
  }

  return {
    accessible: true,
    isBanned,
    canViewBannedUsers,
    isOwner,
    isMod,
    showNsfw: ctx.showNsfw ?? false,
    privacySettings,
  }
}
