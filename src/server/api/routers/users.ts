import analytics from '@/lib/analytics'
import { AppError, ResourceError } from '@/lib/errors'
import {
  RegisterUserSchema,
  GetUserByIdSchema,
  GetAllUsersSchema,
  UpdateUserSchema,
  UpdateUserRoleSchema,
  DeleteUserSchema,
} from '@/schemas/user'
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { updateUserRole } from '@/server/utils/roleSync'
import { hasPermission } from '@/utils/permissions'
import { sanitizeBio } from '@/utils/sanitization'
import { Role } from '@orm'
import type { Prisma } from '@orm'

export const usersRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) return AppError.notAuthenticated()

    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      name: ctx.session.user.name,
      role: ctx.session.user.role,
    }
  }),

  /**
   * @deprecated - use clerk
   */
  register: publicProcedure
    .input(RegisterUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) return ResourceError.user.emailExists()

      // Note: This endpoint is deprecated since Clerk handles user registration
      // This is kept for backward compatibility but should not be used in production
      const user = await ctx.prisma.user.create({
        data: {
          clerkId: `legacy_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          name,
          email,
          role: Role.USER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

      return { status: 'success', data: user }
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
          select: {
            listings: true,
            submittedGames: true,
            votes: true,
          },
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

      // Check if user exists first
      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) return ResourceError.user.notFound()

      // Build where clauses for listings filtering
      const listingsWhere: Prisma.ListingWhereInput = {}
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
        listingsWhere.device = {
          brand: { name: listingsSystem },
        }
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
          _count: {
            select: {
              listings: true,
              votes: true,
            },
          },
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
            device: {
              select: {
                brand: { select: { id: true, name: true } },
                modelName: true,
              },
            },
            game: {
              select: {
                title: true,
                system: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                  },
                },
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
                    system: {
                      select: {
                        id: true,
                        name: true,
                        key: true,
                      },
                    },
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
          select: {
            emulator: { select: { name: true } },
          },
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

        if (existingUser) ResourceError.user.emailExists()
      }

      // Check for username conflicts if name is being updated
      if (name && name.trim()) {
        const existingUserWithName = await ctx.prisma.user.findFirst({
          where: {
            name: name.trim(),
            id: { not: userId }, // Exclude current user
          },
        })

        if (existingUserWithName) {
          AppError.conflict(
            'This username is already taken. Please choose a different one.',
          )
        }
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
  getAll: adminProcedure
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
      let where: Prisma.UserWhereInput = {}

      if (search && search.trim() !== '') {
        const searchTerm = search.trim()
        where = {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
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

  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, userCount, authorCount, adminCount, superAdminCount] =
      await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.user.count({ where: { role: 'USER' } }),
        ctx.prisma.user.count({ where: { role: 'AUTHOR' } }),
        ctx.prisma.user.count({ where: { role: 'ADMIN' } }),
        ctx.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      ])

    return {
      total,
      byRole: {
        user: userCount,
        author: authorCount,
        admin: adminCount,
        superAdmin: superAdminCount,
      },
    }
  }),

  updateRole: adminProcedure
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
        hasPermission(currentUserRole, Role.ADMIN) &&
        !hasPermission(role, Role.ADMIN)
      ) {
        ResourceError.user.cannotDemoteSelf()
      }

      // Only SUPER_ADMIN can modify SUPER_ADMIN users
      if (
        targetUser.role === Role.SUPER_ADMIN &&
        !hasPermission(currentUserRole, Role.SUPER_ADMIN)
      ) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      // Only SUPER_ADMIN can assign SUPER_ADMIN role
      if (
        role === Role.SUPER_ADMIN &&
        !hasPermission(currentUserRole, Role.SUPER_ADMIN)
      ) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
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

  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = input

      // Prevent self-deletion
      if (userId === ctx.session.user.id) ResourceError.user.cannotDeleteSelf()

      await ctx.prisma.user.delete({ where: { id: userId } })

      return { success: true }
    }),
})
