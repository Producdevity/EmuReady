import * as Sentry from '@sentry/nextjs'
import analytics from '@/lib/analytics'
import { ResourceError } from '@/lib/errors'
import {
  DeleteUserSchema,
  GetAllUsersSchema,
  GetUserByIdSchema,
  SearchUsersSchema,
  UpdateUserRoleSchema,
  UpdateUserSchema,
  IsVerifiedDeveloperSchema,
  GetTopContributorsSummarySchema,
} from '@/schemas/user'
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { invalidateUser } from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import {
  aggregateContributions,
  buildTopContributorsSummary,
  EMPTY_TOP_CONTRIBUTORS_SUMMARY,
  getTopContributorsRaw,
  getUserContributionBreakdown,
  type RawContributor,
  type ContributorTimeframe,
} from '@/server/services/contributors.service'
import { buildOrderBy, paginate } from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { createCountQuery } from '@/server/utils/query-performance'
import { updateUserRole } from '@/server/utils/roleSync'
import {
  hasPermissionInContext,
  PERMISSIONS,
  ROLE_HIERARCHY,
  roleIncludesRole,
} from '@/utils/permission-system'
import { sanitizeBio } from '@/utils/sanitization'
import { ApprovalStatus, Role } from '@orm'
import type { Prisma, PrismaClient } from '@orm'

function accumulateVoteGroups(groups: { value: boolean; _count: { _all: number } }[]) {
  return groups.reduce(
    (acc, group) => {
      const count = group._count._all
      acc.total += count
      if (group.value) acc.upvotes += count
      else acc.downvotes += count
      return acc
    },
    { total: 0, upvotes: 0, downvotes: 0 },
  )
}

async function getUserVoteSummary(prisma: PrismaClient, userId: string) {
  const [listingVotes, pcListingVotes] = await Promise.all([
    prisma.vote.groupBy({
      by: ['value'],
      where: { listing: { authorId: userId } },
      _count: { _all: true },
    }),
    prisma.pcListingVote.groupBy({
      by: ['value'],
      where: { pcListing: { authorId: userId } },
      _count: { _all: true },
    }),
  ])

  const listingTotals = accumulateVoteGroups(listingVotes)
  const pcTotals = accumulateVoteGroups(pcListingVotes)

  return {
    total: listingTotals.total + pcTotals.total,
    upvotes: listingTotals.upvotes + pcTotals.upvotes,
    downvotes: listingTotals.downvotes + pcTotals.downvotes,
  }
}

// TODO: this needs to be extracted in a user.repository.ts and/or a user.service.ts
export const usersRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    const sessionUser = ctx.session?.user

    if (!sessionUser) return null

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      role: sessionUser.role,
      permissions: sessionUser.permissions,
    }
  }),

  topContributorsSummary: publicProcedure
    .input(GetTopContributorsSummarySchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit
      const timeframes: ContributorTimeframe[] = ['all_time', 'this_month', 'this_week']

      let rawResults: RawContributor[][] = [[], [], []]

      try {
        rawResults = await Promise.all(
          timeframes.map((timeframe) => getTopContributorsRaw(ctx.prisma, timeframe, limit)),
        )
      } catch (error) {
        Sentry.captureException(error, { tags: { endpoint: 'topContributorsSummary' } })
        console.error('Failed to load top contributors summary', error)
        return EMPTY_TOP_CONTRIBUTORS_SUMMARY
      }

      const candidateIds = Array.from(
        new Set(rawResults.flatMap((list) => list.map((item) => item.userId))),
      )

      if (candidateIds.length === 0) return EMPTY_TOP_CONTRIBUTORS_SUMMARY

      // Fetch lifetime contributions for badge display
      const lifetimeContributions = await aggregateContributions(ctx.prisma, {
        userIds: candidateIds,
      })
      const lifetimeContributionMap = new Map(Object.entries(lifetimeContributions))

      const users = await ctx.prisma.user.findMany({
        where: { id: { in: candidateIds } }, // ban filter applied in SQL
        select: {
          id: true,
          name: true,
          profileImage: true,
          role: true,
          trustScore: true,
          bio: true,
          createdAt: true,
        },
      })

      const userMap = new Map(users.map((user) => [user.id, user]))
      return buildTopContributorsSummary(rawResults, limit, userMap, lifetimeContributionMap)
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true,
        role: true,
        trustScore: true,
        createdAt: true,
        listings: {
          select: {
            id: true,
            createdAt: true,
            device: { select: { brand: { select: { id: true, name: true } }, modelName: true } },
            game: { select: { title: true } },
            emulator: { select: { name: true } },
            performance: { select: { label: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to 10 most recent listings
        },
        // Limit submitted games to recent ones
        submittedGames: {
          select: {
            id: true,
            title: true,
            status: true,
            submittedAt: true,
            approvedAt: true,
            system: { select: { id: true, name: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 10, // Limit to 10 most recent submissions
        },
        // Limit votes (no ordering available since no timestamp)
        // TODO: add createdAt to votes in the future
        votes: {
          select: {
            id: true,
            value: true,
            listing: {
              select: {
                id: true,
                device: {
                  select: { brand: { select: { id: true, name: true } }, modelName: true },
                },
                game: { select: { title: true } },
                emulator: { select: { name: true } },
                performance: { select: { label: true } },
              },
            },
          },
          take: 10, // Limit to 10 most recent votes
        },
        userBadges: {
          where: { badge: { isActive: true } },
          select: {
            id: true,
            assignedAt: true,
            badge: { select: { id: true, name: true, description: true, color: true, icon: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        _count: { select: { listings: true, submittedGames: true, votes: true } },
      },
    })

    return user ?? ResourceError.user.notFound()
  }),

  getUserById: publicProcedure.input(GetUserByIdSchema).query(async ({ ctx, input }) => {
    const {
      userId,
      listingsPage = 1,
      listingsLimit = 12,
      listingsSearch,
      listingsDevice,
      listingsEmulator,
      votesPage = 1,
      votesLimit = 12,
      votesSearch,
    } = input

    // Check if user exists and get ban status
    const userWithBanStatus = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userBans: {
          where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          select: { id: true },
        },
      },
    })

    if (!userWithBanStatus) return ResourceError.user.notFound()

    // Check if user is banned and if current user can view banned profiles
    const isBanned = userWithBanStatus.userBans.length > 0
    const currentUserRole = ctx.session?.user?.role
    const canViewBannedUsers = roleIncludesRole(currentUserRole, Role.MODERATOR)

    if (isBanned && !canViewBannedUsers) return ResourceError.user.profileNotAccessible()

    // Build where clauses for listings filtering
    const listingsWhere: Prisma.ListingWhereInput = {}
    const listingsGameFilter: Prisma.GameWhereInput = {}
    if (!ctx.session?.user?.showNsfw) listingsGameFilter.isErotic = false

    if (listingsDevice) listingsWhere.deviceId = listingsDevice

    // Filter by approval status based on user permissions
    if (canViewBannedUsers) {
      // Moderators can see all statuses including rejected
      // No additional filtering needed
    } else if (ctx.session?.user?.id === userId) {
      // Users can see their own approved and pending listings, but NOT rejected
      listingsWhere.status = { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] }
    } else {
      // Regular users (including signed out) can ONLY see approved listings from others
      listingsWhere.status = ApprovalStatus.APPROVED
    }

    const listingsSearchConditions = buildSearchFilter(listingsSearch, [
      'game.title',
      'device.modelName',
      'emulator.name',
    ])
    if (listingsSearchConditions) listingsWhere.OR = listingsSearchConditions
    if (Object.keys(listingsGameFilter).length > 0) {
      listingsWhere.game = listingsGameFilter
    }
    if (listingsEmulator) listingsWhere.emulator = { name: listingsEmulator }

    // Build where clauses for votes filtering
    const voteVisibilityWhere: Prisma.VoteWhereInput = {}
    if (!ctx.session?.user?.showNsfw) {
      voteVisibilityWhere.listing = { game: { isErotic: false } }
    }
    const votesWhere: Prisma.VoteWhereInput = { ...voteVisibilityWhere }
    const votesSearchConditions = buildSearchFilter(votesSearch, [
      'listing.game.title',
      'listing.device.modelName',
      'listing.emulator.name',
    ])
    if (votesSearchConditions) votesWhere.OR = votesSearchConditions

    // Get user basic info
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        profileImage: true,
        role: true,
        trustScore: true,
        createdAt: true,
        trustActionLogs: {
          select: { id: true, action: true, weight: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // Include ban status for moderators
        ...(canViewBannedUsers && {
          userBans: {
            where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            select: {
              id: true,
              reason: true,
              expiresAt: true,
              bannedBy: { select: { name: true } },
              createdAt: true,
            },
          },
        }),
        userBadges: {
          where: { badge: { isActive: true } },
          select: {
            id: true,
            assignedAt: true,
            color: true,
            badge: { select: { id: true, name: true, description: true, color: true, icon: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        _count: { select: { listings: true, pcListings: true, submittedGames: true, votes: true } },
      },
    })

    // Get paginated listings with filtering
    const listingsSkip = (listingsPage - 1) * listingsLimit
    const [listings, listingsTotal] = await Promise.all([
      ctx.prisma.listing.findMany({
        where: { authorId: userId, ...listingsWhere },
        select: {
          id: true,
          createdAt: true,
          status: true,
          device: { select: { brand: { select: { id: true, name: true } }, modelName: true } },
          game: {
            select: { title: true, system: { select: { id: true, name: true, key: true } } },
          },
          emulator: { select: { name: true } },
          performance: { select: { label: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: listingsSkip,
        take: listingsLimit,
      }),
      ctx.prisma.listing.count({ where: { authorId: userId, ...listingsWhere } }),
    ])

    // Get paginated votes with filtering
    const votesSkip = (votesPage - 1) * votesLimit
    const [votes, votesTotal] = await Promise.all([
      ctx.prisma.vote.findMany({
        where: { userId, ...votesWhere },
        select: {
          id: true,
          value: true,
          listing: {
            select: {
              id: true,
              device: { select: { brand: { select: { id: true, name: true } }, modelName: true } },
              game: {
                select: { title: true, system: { select: { id: true, name: true, key: true } } },
              },
              emulator: { select: { name: true } },
              performance: { select: { label: true, rank: true } },
            },
          },
        },
        orderBy: { id: 'desc' }, // Use id for consistent ordering since votes don't have timestamps
        skip: votesSkip,
        take: votesLimit,
      }),
      ctx.prisma.vote.count({ where: { userId, ...votesWhere } }),
    ])

    // Get filter options (for frontend dropdowns)
    const [availableDevices, availableEmulators, contributionSummary, voteSummary] =
      await Promise.all([
        ctx.prisma.listing.findMany({
          where: { authorId: userId },
          select: {
            device: {
              select: {
                id: true,
                modelName: true,
                brand: { select: { name: true } },
              },
            },
          },
          distinct: ['deviceId'],
        }),
        ctx.prisma.listing.findMany({
          where: { authorId: userId },
          select: { emulator: { select: { name: true } } },
          distinct: ['emulatorId'],
        }),
        getUserContributionBreakdown(ctx.prisma, userId),
        getUserVoteSummary(ctx.prisma, userId),
      ])

    return {
      ...user,
      listings: {
        items: listings,
        pagination: paginate({ total: listingsTotal, page: listingsPage, limit: listingsLimit }),
      },
      votes: {
        items: votes,
        pagination: paginate({ total: votesTotal, page: votesPage, limit: votesLimit }),
      },
      filterOptions: {
        devices: availableDevices
          .map((entry) => {
            if (!entry.device?.id) return null
            const brand = entry.device.brand?.name ?? ''
            const model = entry.device.modelName ?? ''
            const label = [brand, model].filter(Boolean).join(' ').trim() || 'Unknown Device'
            return { id: entry.device.id, label }
          })
          .filter((device): device is { id: string; label: string } => Boolean(device)),
        emulators: [...new Set(availableEmulators.map((l) => l.emulator?.name).filter(Boolean))],
      },
      contributionSummary,
      voteSummary,
    }
  }),

  update: protectedProcedure.input(UpdateUserSchema).mutation(async ({ ctx, input }) => {
    const { name, email, profileImage, bio } = input
    const userId = ctx.session.user.id

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, clerkId: true },
    })

    if (!user) return ResourceError.user.notFound()

    if (email && email !== user.email) {
      const existingUser = await ctx.prisma.user.findUnique({ where: { email } })

      if (existingUser) return ResourceError.user.emailExists()
    }

    // Check for username conflicts if name is being updated
    if (name && name.trim()) {
      const existingUserWithName = await ctx.prisma.user.findFirst({
        // Exclude current user
        where: { name: name.trim(), id: { not: userId } },
      })

      if (existingUserWithName) return ResourceError.user.usernameExists()
    }

    // Sync name changes back to Clerk if username is being updated
    if (name !== undefined && user.clerkId) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const clerk = await clerkClient()

        // Update username in Clerk to keep them in sync
        await clerk.users.updateUser(user.clerkId, {
          username: name || undefined, // Clear username if name is empty
        })
      } catch (clerkError) {
        console.error('Failed to sync username to Clerk:', clerkError)
        // Continue with database update even if Clerk sync fails
        // The webhook will eventually sync it back if Clerk is updated manually
      }
    }

    // Update user in database
    const result = await ctx.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name?.trim() || null }),
        ...(email && { email }),
        ...(profileImage && { profileImage }),
        ...(bio !== undefined && { bio: bio ? sanitizeBio(bio) : null }),
        lastActiveAt: new Date(),
      },
      select: { id: true, name: true, email: true, bio: true, profileImage: true, role: true },
    })

    // Invalidate SEO cache for user profile
    await invalidateUser(userId)

    return result
  }),

  // Admin and Moderator routes
  get: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetAllUsersSchema)
    .query(async ({ ctx, input }) => {
      const { search, sortField, sortDirection, page = 1, limit = 20 } = input ?? {}
      const skip = (page - 1) * limit

      // Build where clause for search
      const where: Prisma.UserWhereInput = {}

      const searchConditions = buildSearchFilter(search, ['name', 'email'])
      if (searchConditions) where.OR = searchConditions

      const sortConfig = {
        name: (dir: 'asc' | 'desc') => ({ name: dir }),
        email: (dir: 'asc' | 'desc') => ({ email: dir }),
        role: (dir: 'asc' | 'desc') => ({ role: dir }),
        createdAt: (dir: 'asc' | 'desc') => ({ createdAt: dir }),
        listingsCount: (dir: 'asc' | 'desc') => ({ listings: { _count: dir } }),
        votesCount: (dir: 'asc' | 'desc') => ({ votes: { _count: dir } }),
        commentsCount: (dir: 'asc' | 'desc') => ({ comments: { _count: dir } }),
        trustScore: (dir: 'asc' | 'desc') => ({ trustScore: dir }),
      }

      const orderBy = buildOrderBy<Prisma.UserOrderByWithRelationInput>(
        sortConfig,
        sortField,
        sortDirection,
        { createdAt: 'desc' },
      )

      const [users, totalUsers] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            trustScore: true,
            createdAt: true,
            _count: { select: { listings: true, votes: true, comments: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
        createCountQuery(ctx.prisma.user, where),
      ])

      return {
        users,
        pagination: paginate({ total: totalUsers, page, limit }),
      }
    }),

  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const [
      userCount,
      authorCount,
      developerCount,
      moderatorCount,
      adminCount,
      superAdminCount,
      bannedUsersCount,
    ] = await Promise.all([
      createCountQuery(ctx.prisma.user, { role: Role.USER }),
      createCountQuery(ctx.prisma.user, { role: Role.AUTHOR }),
      createCountQuery(ctx.prisma.user, { role: Role.DEVELOPER }),
      createCountQuery(ctx.prisma.user, { role: Role.MODERATOR }),
      createCountQuery(ctx.prisma.user, { role: Role.ADMIN }),
      createCountQuery(ctx.prisma.user, { role: Role.SUPER_ADMIN }),
      createCountQuery(ctx.prisma.user, {
        userBans: {
          some: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      }),
    ])

    const total =
      userCount + developerCount + moderatorCount + authorCount + adminCount + superAdminCount

    return {
      total,
      byRole: {
        user: userCount,
        author: authorCount,
        developer: developerCount,
        moderator: moderatorCount,
        admin: adminCount,
        superAdmin: superAdminCount,
      },
      bannedUsers: bannedUsersCount,
    }
  }),

  updateRole: permissionProcedure(PERMISSIONS.CHANGE_USER_ROLES)
    .input(UpdateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input
      const currentUserRole = ctx.session.user.role

      // Get the target user's current role
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true, email: true },
      })

      if (!targetUser) return ResourceError.user.notFound()

      // Prevent self-demotion from admin roles
      if (
        userId === ctx.session.user.id &&
        roleIncludesRole(currentUserRole, Role.ADMIN) &&
        !roleIncludesRole(role, Role.ADMIN)
      ) {
        return ResourceError.user.cannotDemoteSelf()
      }

      // Only users with MODIFY_SUPER_ADMIN_USERS permission can modify SUPER_ADMIN users
      if (
        targetUser.role === Role.SUPER_ADMIN &&
        !hasPermissionInContext(ctx, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
      ) {
        return ResourceError.user.needsPermissionToModifySuperAdmin()
      }

      // Only users with MODIFY_SUPER_ADMIN_USERS permission can assign SUPER_ADMIN role
      if (
        role === Role.SUPER_ADMIN &&
        !hasPermissionInContext(ctx, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
      ) {
        return ResourceError.user.needsPermissionToAssignSuperAdmin()
      }

      // Use the role sync utility to update both database and Clerk
      await updateUserRole(userId, role)

      analytics.admin.userRoleChanged({
        userId: targetUser.id,
        adminId: ctx.session.user.id,
        oldRole: targetUser.role,
        newRole: role,
      })

      // Emit notification event for role change
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.USER_ROLE_CHANGED,
        entityType: 'user',
        entityId: targetUser.id,
        triggeredBy: ctx.session.user.id,
        payload: {
          userId: targetUser.id,
          oldRole: targetUser.role,
          newRole: role,
          changedBy: ctx.session.user.id,
          changedAt: new Date().toISOString(),
        },
      })

      // Return updated user data
      const updatedUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      })

      // Invalidate SEO cache for user profile
      await invalidateUser(userId)

      return updatedUser
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_USERS)
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (input.userId === ctx.session.user.id) return ResourceError.user.cannotDeleteSelf()

      await ctx.prisma.user.delete({ where: { id: input.userId } })

      return { success: true }
    }),

  searchUsers: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(SearchUsersSchema)
    .query(async ({ ctx, input }) => {
      const { query, limit, minRole } = input

      const where: Prisma.UserWhereInput = {}

      const searchConditions = buildSearchFilter(query, ['name', 'email'])
      if (searchConditions) where.OR = searchConditions

      // Filter by minimum role if specified
      if (minRole) {
        const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole)
        const allowedRoles = ROLE_HIERARCHY.slice(minRoleIndex)
        where.role = { in: allowedRoles }
      }

      return await ctx.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          trustScore: true,
        },
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
        take: limit,
      })
    }),

  isVerifiedDeveloper: protectedProcedure
    .input(IsVerifiedDeveloperSchema)
    .query(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: ctx.session.user.id,
            emulatorId: input.emulatorId,
          },
        },
      })

      return !!verifiedDeveloper
    }),
})
