import { type z } from 'zod'
import { UserRepository } from '@/features/users/server/user.repository'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'
import { type UserPrivacySettingsSchema } from '../shared/user-output.schemas'
import type { PrismaClient } from '@orm/client'

interface ProfileAccessContext {
  currentUserId?: string
  currentUserRole?: Role
  showNsfw?: boolean
}

type PrivacySettings = z.output<typeof UserPrivacySettingsSchema>

export const PROFILE_ACCESS_REASONS = {
  NOT_FOUND: 'not_found',
  BANNED: 'banned',
  PRIVATE: 'private',
} as const

export type ProfileAccessReason =
  (typeof PROFILE_ACCESS_REASONS)[keyof typeof PROFILE_ACCESS_REASONS]

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
  reason: ProfileAccessReason
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
  const user = await new UserRepository(prisma).profileAccessRecord(targetUserId)
  return evaluateProfileAccess(user, targetUserId, ctx)
}

export function evaluateProfileAccess(
  user: Awaited<ReturnType<UserRepository['profileAccessRecord']>>,
  targetUserId: string,
  ctx: ProfileAccessContext,
): ProfileAccessResult {
  if (!user) return { accessible: false, reason: PROFILE_ACCESS_REASONS.NOT_FOUND }

  const isBanned = user.userBans.length > 0
  const canViewBannedUsers = roleIncludesRole(ctx.currentUserRole, Role.MODERATOR)
  const isOwner = ctx.currentUserId === targetUserId
  const isMod = canViewBannedUsers

  if (isBanned && !canViewBannedUsers) {
    return { accessible: false, reason: PROFILE_ACCESS_REASONS.BANNED }
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
    return { accessible: false, reason: PROFILE_ACCESS_REASONS.PRIVATE }
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
