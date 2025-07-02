import analytics from '@/lib/analytics'
import { AppError, ResourceError } from '@/lib/errors'
import {
  DeleteUserSchema,
  GetAllUsersSchema,
  GetUserByIdSchema,
  SearchUsersSchema,
  UpdateUserRoleSchema,
  UpdateUserSchema,
} from '@/schemas/user'
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import {
  NOTIFICATION_EVENTS,
  notificationEventEmitter,
} from '@/server/notifications/eventEmitter'
import { updateUserRole } from '@/server/utils/roleSync'
import {
  hasPermissionInContext,
  PERMISSIONS,
  roleIncludesRole,
} from '@/utils/permission-system'
import { sanitizeBio } from '@/utils/sanitization'
import { ApprovalStatus, Role } from '@orm'
import type { Prisma } from '@orm'

export const usersRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) return AppError.notAuthenticated()

    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      name: ctx.session.user.name,
      role: ctx.session.user.role,
      permissions: ctx.session.user.permissions,
    }
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
            device: {
              select: {
                brand: { select: { id: true, name: true } },
                modelName: true,
              },
            },
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
                  select: {
                    brand: { select: { id: true, name: true } },
                    modelName: true,
                  },
                },
                game: { select: { title: true } },
                emulator: { select: { name: true } },
                performance: { select: { label: true } },
              },
            },
          },
          take: 10, // Limit to 10 most recent votes
        },
        _count: {
          select: { listings: true, submittedGames: true, votes: true },
        },
      },
    })

    return user ?? ResourceError.user.notFound()
  }),

  getUserById: publicProcedure
    .input(GetUserByIdSchema)
    .query(async ({ ctx, input }) => {
      const {
        userId,
        listingsPage = 1,
        listingsLimit = 12,
        listingsSearch,
        listingsSystem,
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
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { id: true },
          },
        },
      })

      if (!userWithBanStatus) return ResourceError.user.notFound()

      // Check if user is banned and if current user can view banned profiles
      const isBanned = userWithBanStatus.userBans.length > 0
      const currentUserRole = ctx.session?.user?.role
      const canViewBannedUsers = roleIncludesRole(
        currentUserRole,
        Role.MODERATOR,
      )

      if (isBanned && !canViewBannedUsers) {
        throw AppError.forbidden('This user profile is not accessible.')
      }

      // Build where clauses for listings filtering
      const listingsWhere: Prisma.ListingWhereInput = {}

      // Filter by approval status based on user permissions
      if (canViewBannedUsers) {
        // Moderators can see all statuses including rejected
        // No additional filtering needed
      } else if (ctx.session?.user?.id === userId) {
        // Users can see their own approved and pending listings, but NOT rejected
        listingsWhere.status = {
          in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING],
        }
      } else {
        // Regular users (including signed out) can ONLY see approved listings from others
        listingsWhere.status = ApprovalStatus.APPROVED
      }

      if (listingsSearch) {
        listingsWhere.OR = [
          {
            game: { title: { contains: listingsSearch, mode: 'insensitive' } },
          },
          {
            device: {
              modelName: { contains: listingsSearch, mode: 'insensitive' },
            },
          },
          {
            emulator: {
              name: { contains: listingsSearch, mode: 'insensitive' },
            },
          },
        ]
      }
      if (listingsSystem) {
        listingsWhere.device = { brand: { name: listingsSystem } }
      }
      if (listingsEmulator) {
        listingsWhere.emulator = { name: listingsEmulator }
      }

      // Build where clauses for votes filtering
      const votesWhere: Prisma.VoteWhereInput = {}
      if (votesSearch) {
        votesWhere.listing = {
          OR: [
            { game: { title: { contains: votesSearch, mode: 'insensitive' } } },
            {
              device: {
                modelName: { contains: votesSearch, mode: 'insensitive' },
              },
            },
            {
              emulator: {
                name: { contains: votesSearch, mode: 'insensitive' },
              },
            },
          ],
        }
      }

      // Get user basic info
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
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
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: {
                id: true,
                reason: true,
                expiresAt: true,
                bannedBy: { select: { name: true } },
                createdAt: true,
              },
            },
          }),
          _count: { select: { listings: true, votes: true } },
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
            device: {
              select: {
                brand: { select: { id: true, name: true } },
                modelName: true,
              },
            },
            game: {
              select: {
                title: true,
                system: { select: { id: true, name: true, key: true } },
              },
            },
            emulator: { select: { name: true } },
            performance: { select: { label: true, rank: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: listingsSkip,
          take: listingsLimit,
        }),
        ctx.prisma.listing.count({
          where: { authorId: userId, ...listingsWhere },
        }),
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
                device: {
                  select: {
                    brand: { select: { id: true, name: true } },
                    modelName: true,
                  },
                },
                game: {
                  select: {
                    title: true,
                    system: { select: { id: true, name: true, key: true } },
                  },
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
      const [availableSystems, availableEmulators] = await Promise.all([
        ctx.prisma.listing.findMany({
          where: { authorId: userId },
          select: { device: { select: { brand: { select: { name: true } } } } },
          distinct: ['deviceId'],
        }),
        ctx.prisma.listing.findMany({
          where: { authorId: userId },
          select: { emulator: { select: { name: true } } },
          distinct: ['emulatorId'],
        }),
      ])

      return {
        ...user,
        listings: {
          items: listings,
          pagination: {
            total: listingsTotal,
            pages: Math.ceil(listingsTotal / listingsLimit),
            page: listingsPage,
            limit: listingsLimit,
          },
        },
        votes: {
          items: votes,
          pagination: {
            total: votesTotal,
            pages: Math.ceil(votesTotal / votesLimit),
            page: votesPage,
            limit: votesLimit,
          },
        },
        filterOptions: {
          systems: [
            ...new Set(availableSystems.map((l) => l.device.brand.name)),
          ],
          emulators: [
            ...new Set(
              availableEmulators.map((l) => l.emulator?.name).filter(Boolean),
            ),
          ],
        },
      }
    }),

  update: protectedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, profileImage, bio } = input
      const userId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, clerkId: true },
      })

      if (!user) return ResourceError.user.notFound()

      if (email && email !== user.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) return ResourceError.user.emailExists()
      }

      // Check for username conflicts if name is being updated
      if (name && name.trim()) {
        const existingUserWithName = await ctx.prisma.user.findFirst({
          where: {
            name: name.trim(),
            id: { not: userId }, // Exclude current user
          },
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
      return await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name: name?.trim() || null }),
          ...(email && { email }),
          ...(profileImage && { profileImage }),
          ...(bio !== undefined && { bio: bio ? sanitizeBio(bio) : null }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          profileImage: true,
          role: true,
        },
      })
    }),

  // Admin-only routes
  getAll: permissionProcedure(PERMISSIONS.MANAGE_USERS)
    .input(GetAllUsersSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        sortField,
        sortDirection,
        page = 1,
        limit = 20,
      } = input ?? {}
      const skip = (page - 1) * limit

      // Build where clause for search
      const where: Prisma.UserWhereInput = {}

      if (search && search.trim() !== '') {
        const searchTerm = search.trim()
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ]
      }

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.UserOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'name':
            orderBy.push({ name: sortDirection })
            break
          case 'email':
            orderBy.push({ email: sortDirection })
            break
          case 'role':
            orderBy.push({ role: sortDirection })
            break
          case 'createdAt':
            orderBy.push({ createdAt: sortDirection })
            break
          case 'listingsCount':
            orderBy.push({ listings: { _count: sortDirection } })
            break
          case 'votesCount':
            orderBy.push({ votes: { _count: sortDirection } })
            break
          case 'commentsCount':
            orderBy.push({ comments: { _count: sortDirection } })
            break
          case 'trustScore':
            orderBy.push({ trustScore: sortDirection })
            break
        }
      }

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ createdAt: 'desc' })
      }

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
        ctx.prisma.user.count({ where }),
      ])

      return {
        users,
        pagination: {
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
          page,
          limit,
        },
      }
    }),

  getStats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(
    async ({ ctx }) => {
      const [
        userCount,
        developerCount,
        moderatorCount,
        authorCount,
        adminCount,
        superAdminCount,
      ] = await Promise.all([
        ctx.prisma.user.count({ where: { role: Role.USER } }),
        ctx.prisma.user.count({ where: { role: Role.AUTHOR } }),
        ctx.prisma.user.count({ where: { role: Role.DEVELOPER } }),
        ctx.prisma.user.count({ where: { role: Role.MODERATOR } }),
        ctx.prisma.user.count({ where: { role: Role.ADMIN } }),
        ctx.prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
      ])

      const total =
        userCount +
        developerCount +
        moderatorCount +
        authorCount +
        adminCount +
        superAdminCount

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
      }
    },
  ),

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
        ResourceError.user.cannotDemoteSelf()
      }

      // Only users with MODIFY_SUPER_ADMIN_USERS permission can modify SUPER_ADMIN users
      if (
        targetUser.role === Role.SUPER_ADMIN &&
        !hasPermissionInContext(ctx, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
      ) {
        return AppError.forbidden(
          'You need permission to modify super admin users',
        )
      }

      // Only users with MODIFY_SUPER_ADMIN_USERS permission can assign SUPER_ADMIN role
      if (
        role === Role.SUPER_ADMIN &&
        !hasPermissionInContext(ctx, PERMISSIONS.MODIFY_SUPER_ADMIN_USERS)
      ) {
        return AppError.forbidden(
          'You need permission to assign super admin role',
        )
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
      return await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      })
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_USERS)
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (input.userId === ctx.session.user.id) {
        return ResourceError.user.cannotDeleteSelf()
      }

      await ctx.prisma.user.delete({ where: { id: input.userId } })

      return { success: true }
    }),

  searchUsers: permissionProcedure(PERMISSIONS.MANAGE_USERS)
    .input(SearchUsersSchema)
    .query(async ({ ctx, input }) => {
      const { query, limit, minRole } = input

      const where: Prisma.UserWhereInput = {}

      if (query && query.trim().length > 0) {
        const searchTerm = query.trim()
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ]
      }

      // Filter by minimum role if specified
      if (minRole) {
        const roles: Role[] = [
          Role.USER,
          Role.AUTHOR,
          Role.DEVELOPER,
          Role.MODERATOR,
          Role.ADMIN,
          Role.SUPER_ADMIN,
        ]
        const minRoleIndex = roles.indexOf(minRole)
        const allowedRoles = roles.slice(minRoleIndex)
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
        },
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
        take: limit,
      })
    }),
})
