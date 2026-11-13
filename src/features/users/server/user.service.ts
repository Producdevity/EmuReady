import * as Sentry from '@sentry/nextjs'
import { type z } from 'zod'
import { type UserRepository } from '@/features/users/server/user.repository'
import {
  type GetUserByIdSchema,
  type GetAllUsersSchema,
  type SearchUsersSchema,
  type UpdateUserRoleSchema,
  type UpdateUserSchema,
} from '@/features/users/shared/user.schemas'
import analytics from '@/lib/analytics'
import { ResourceError } from '@/lib/errors'
import { type MutationSuccess } from '@/schemas/common'
import { requireActorPermission, requireUserActor, type Actor } from '@/server/auth/actor'
import { invalidateUser } from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import {
  buildTopContributorsSummary,
  EMPTY_TOP_CONTRIBUTORS_SUMMARY,
  type ContributorTimeframe,
  type RawContributor,
} from '@/server/services/contributors.service'
import { paginatedResponse } from '@/server/utils/pagination'
import { updateUserRole } from '@/server/utils/roleSync'
import { hasPermission, PERMISSIONS, roleIncludesRole } from '@/utils/permission-system'
import { sanitizeBio } from '@/utils/sanitization'
import { Role } from '@orm'
import { evaluateProfileAccess, PRIVATE_PROFILE_SETTINGS } from './profile-access.service'
import { type PublicUserProfileOutputSchema } from '../shared/user-output.schemas'

export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly deleteAccount: (userId: string) => Promise<void>,
  ) {}

  async topContributorsSummary(limit: number) {
    const timeframes: ContributorTimeframe[] = ['all_time', 'this_month', 'this_week']
    let results: RawContributor[][]
    try {
      results = await Promise.all(
        timeframes.map((timeframe) => this.repository.topContributors(timeframe, limit)),
      )
    } catch (error) {
      Sentry.captureException(error, { tags: { endpoint: 'topContributorsSummary' } })
      console.error('Failed to load top contributors summary', error)
      return EMPTY_TOP_CONTRIBUTORS_SUMMARY
    }
    const userIds = [...new Set(results.flatMap((list) => list.map((entry) => entry.userId)))]
    if (userIds.length === 0) return EMPTY_TOP_CONTRIBUTORS_SUMMARY
    const contributions = await this.repository.lifetimeContributions(userIds)
    const users = await this.repository.contributorUsers(userIds)
    return buildTopContributorsSummary(
      results,
      limit,
      new Map(users.map((user) => [user.id, user])),
      new Map(Object.entries(contributions)),
    )
  }

  async getProfile(actor: Actor) {
    const user = requireUserActor(actor)
    return (await this.repository.ownProfile(user.userId)) ?? ResourceError.user.notFound()
  }

  async getUserById(
    actor: Actor,
    input: z.output<typeof GetUserByIdSchema>,
  ): Promise<z.output<typeof PublicUserProfileOutputSchema>> {
    const viewer = actor.type === 'user' ? actor : undefined
    const access = evaluateProfileAccess(
      await this.repository.profileAccessRecord(input.userId),
      input.userId,
      {
        currentUserId: viewer?.userId,
        currentUserRole: viewer?.role,
        showNsfw: viewer?.showNsfw,
      },
    )
    if (!access.accessible) {
      if (access.reason === 'not_found') return ResourceError.user.notFound()
      if (access.reason === 'banned') return ResourceError.user.profileNotAccessible()
      const user = await this.repository.limitedProfile(input.userId)
      if (!user) return ResourceError.user.notFound()
      return {
        ...user,
        ...PRIVATE_PROFILE_SETTINGS,
        _count: { ...user._count, votes: 0 },
        bio: null,
        listings: paginatedResponse({ items: [], total: 0, page: 1, limit: input.listingsLimit }),
        votes: paginatedResponse({ items: [], total: 0, page: 1, limit: input.votesLimit }),
        pcListings: paginatedResponse({
          items: [],
          total: 0,
          page: 1,
          limit: input.pcListingsLimit,
        }),
        trustActionLogs: paginatedResponse({
          items: [],
          total: 0,
          page: 1,
          limit: input.trustActionsLimit,
        }),
        filterOptions: { devices: [], emulators: [] },
        contributionSummary: null,
        voteSummary: null,
        limitedProfile: true,
      }
    }

    const user = await this.repository.publicProfile(input.userId, access.canViewBannedUsers)
    if (!user) return ResourceError.user.notFound()
    const showVotes = access.isOwner || access.isMod || access.privacySettings.showVotingActivity
    const [
      listings,
      pcListings,
      votes,
      trustActionLogs,
      filterOptions,
      contributionSummary,
      voteSummary,
    ] = await Promise.all([
      this.repository.profileReports(input, access),
      this.repository.profilePcReports(input, access),
      showVotes
        ? this.repository.profileVotes(input, access)
        : Promise.resolve(
            paginatedResponse({
              items: [],
              total: 0,
              page: input.votesPage,
              limit: input.votesLimit,
            }),
          ),
      this.repository.profileTrustActions(input),
      this.repository.profileFilterOptions(input.userId),
      this.repository.contributionBreakdown(input.userId),
      this.repository.receivedReportVoteSummary(input.userId),
    ])
    return {
      ...user,
      ...access.privacySettings,
      _count: { ...user._count, votes: showVotes ? user._count.votes : 0 },
      listings,
      pcListings,
      votes,
      trustActionLogs,
      filterOptions: {
        devices: filterOptions.devices.map((entry) => ({
          id: entry.device.id,
          label:
            [entry.device.brand.name, entry.device.modelName].filter(Boolean).join(' ').trim() ||
            'Unknown Device',
        })),
        emulators: [...new Set(filterOptions.emulators.map((entry) => entry.emulator.name))],
      },
      contributionSummary,
      voteSummary,
    }
  }

  async update(actor: Actor, input: z.output<typeof UpdateUserSchema>): Promise<MutationSuccess> {
    const actorUser = requireUserActor(actor)
    const user = await this.repository.updateSource(actorUser.userId)
    if (!user) return ResourceError.user.notFound()
    if (
      input.email &&
      input.email !== user.email &&
      (await this.repository.emailOwner(input.email))
    ) {
      return ResourceError.user.emailExists()
    }
    if (
      input.name?.trim() &&
      (await this.repository.usernameOwner(input.name.trim(), actorUser.userId))
    ) {
      return ResourceError.user.usernameExists()
    }
    if (input.name !== undefined && user.clerkId) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const clerk = await clerkClient()
        await clerk.users.updateUser(user.clerkId, { username: input.name || undefined })
      } catch (error) {
        console.error('Failed to sync username to Clerk:', error)
      }
    }
    await this.repository.updateProfile(actorUser.userId, {
      ...(input.name !== undefined && { name: input.name.trim() || null }),
      ...(input.email && { email: input.email }),
      ...(input.profileImage && { profileImage: input.profileImage }),
      ...(input.bio !== undefined && { bio: input.bio ? sanitizeBio(input.bio) : null }),
      lastActiveAt: new Date(),
    })
    await invalidateUser(actorUser.userId)
    return { success: true }
  }

  getAdminUsers(actor: Actor, input: z.output<typeof GetAllUsersSchema>) {
    requireActorPermission(actor, PERMISSIONS.VIEW_USER_BANS)
    return this.repository.listAdmin(input)
  }

  statistics(actor: Actor) {
    requireActorPermission(actor, PERMISSIONS.VIEW_STATISTICS)
    return this.repository.statistics()
  }

  async updateRole(
    actor: Actor,
    input: z.output<typeof UpdateUserRoleSchema>,
  ): Promise<MutationSuccess> {
    const user = requireActorPermission(actor, PERMISSIONS.CHANGE_USER_ROLES)
    const target = await this.repository.roleChangeTarget(input.userId)
    if (!target) return ResourceError.user.notFound()
    if (
      input.userId === user.userId &&
      roleIncludesRole(user.role, Role.ADMIN) &&
      !roleIncludesRole(input.role, Role.ADMIN)
    ) {
      return ResourceError.user.cannotDemoteSelf()
    }
    if (
      target.role === Role.SUPER_ADMIN &&
      !hasPermission(user.permissions, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
    ) {
      return ResourceError.user.needsPermissionToModifySuperAdmin()
    }
    if (
      input.role === Role.SUPER_ADMIN &&
      !hasPermission(user.permissions, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
    ) {
      return ResourceError.user.needsPermissionToAssignSuperAdmin()
    }
    await updateUserRole(input.userId, input.role)
    analytics.admin.userRoleChanged({
      userId: target.id,
      adminId: user.userId,
      oldRole: target.role,
      newRole: input.role,
    })
    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.USER_ROLE_CHANGED,
      entityType: 'user',
      entityId: target.id,
      triggeredBy: user.userId,
      payload: {
        userId: target.id,
        oldRole: target.role,
        newRole: input.role,
        changedBy: user.userId,
        changedAt: new Date().toISOString(),
      },
    })
    await invalidateUser(input.userId)
    return { success: true }
  }

  async delete(actor: Actor, userId: string): Promise<MutationSuccess> {
    const user = requireActorPermission(actor, PERMISSIONS.MANAGE_USERS)
    if (user.userId === userId) return ResourceError.user.cannotDeleteSelf()
    await this.deleteAccount(userId)
    return { success: true }
  }

  search(actor: Actor, input: z.output<typeof SearchUsersSchema>) {
    requireActorPermission(actor, PERMISSIONS.VIEW_USER_BANS)
    return this.repository.search(input)
  }

  isVerifiedDeveloper(actor: Actor, emulatorId: string) {
    return this.repository.isVerifiedDeveloper(requireUserActor(actor).userId, emulatorId)
  }
}
