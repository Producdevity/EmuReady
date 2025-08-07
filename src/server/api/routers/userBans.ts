import { ResourceError, AppError } from '@/lib/errors'
import {
  CheckUserBanStatusSchema,
  CreateUserBanSchema,
  DeleteUserBanSchema,
  GetUserBanByIdSchema,
  GetUserBansSchema,
  LiftUserBanSchema,
  UpdateUserBanSchema,
} from '@/schemas/userBan'
import {
  createTRPCRouter,
  permissionProcedure,
  publicProcedure,
  viewUserBansProcedure,
  protectedProcedure,
} from '@/server/api/trpc'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { Role, type Prisma } from '@orm'

export const userBansRouter = createTRPCRouter({
  getStats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(
    async ({ ctx }) => {
      const [total, active, expired, permanent] = await Promise.all([
        ctx.prisma.userBan.count(),
        ctx.prisma.userBan.count({
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }),
        ctx.prisma.userBan.count({
          where: { isActive: true, expiresAt: { lt: new Date() } },
        }),
        ctx.prisma.userBan.count({
          where: { isActive: true, expiresAt: null },
        }),
      ])

      return { total, active, expired, permanent }
    },
  ),

  getAll: viewUserBansProcedure
    .input(GetUserBansSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        isActive,
        sortField = 'bannedAt',
        sortDirection = 'desc',
        page = 1,
        limit = 20,
      } = input ?? {}

      const offset = (page - 1) * limit

      // Build where clause
      const where: Prisma.UserBanWhereInput = {}

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { reason: { contains: search, mode: 'insensitive' } },
          { bannedBy: { name: { contains: search, mode: 'insensitive' } } },
        ]
      }

      if (isActive !== undefined) where.isActive = isActive

      // Build orderBy
      const orderBy: Prisma.UserBanOrderByWithRelationInput = {}
      if (sortField && sortDirection) {
        orderBy[sortField] = sortDirection
      }

      const [bans, total] = await Promise.all([
        ctx.prisma.userBan.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
              },
            },
            bannedBy: { select: { id: true, name: true } },
            unbannedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.userBan.count({ where }),
      ])

      const pages = Math.ceil(total / limit)

      return {
        bans,
        pagination: { page, limit, total, pages },
      }
    }),

  getById: viewUserBansProcedure
    .input(GetUserBanByIdSchema)
    .query(async ({ ctx, input }) => {
      const ban = await ctx.prisma.userBan.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          bannedBy: { select: { id: true, name: true } },
          unbannedBy: { select: { id: true, name: true } },
        },
      })

      return ban ?? ResourceError.userBan.notFound()
    }),

  create: protectedProcedure
    .input(CreateUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      // Allow moderators and above to create bans
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        return AppError.forbidden(
          'You need to be at least a Moderator to ban users',
        )
      }
      const { userId, reason, notes, expiresAt } = input
      const bannedById = ctx.session.user.id

      // Check if user exists
      const user = await ctx.prisma.user.findUnique({ where: { id: userId } })

      if (!user) return ResourceError.user.notFound()

      // Prevent banning admins or higher roles (except SUPER_ADMIN can ban anyone)
      if (ctx.session.user.role !== Role.SUPER_ADMIN) {
        const userRole = user.role
        const bannedByRole = ctx.session.user.role

        // TODO: this should not be here, global?
        const roleHierarchy = [
          Role.USER,
          Role.AUTHOR,
          Role.DEVELOPER,
          Role.MODERATOR,
          Role.ADMIN,
          Role.SUPER_ADMIN,
        ]
        const userRoleIndex = roleHierarchy.indexOf(userRole)
        const bannedByRoleIndex = roleHierarchy.indexOf(bannedByRole)

        if (userRoleIndex >= bannedByRoleIndex) {
          return ResourceError.userBan.cannotBanHigherRole()
        }
      }

      // Check if user already has an active ban
      const existingBan = await ctx.prisma.userBan.findFirst({
        where: { userId, isActive: true },
      })

      if (existingBan) return ResourceError.userBan.alreadyBanned()

      return await ctx.prisma.userBan.create({
        data: { userId, bannedById, reason, notes, expiresAt },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bannedBy: { select: { id: true, name: true } },
        },
      })
    }),

  update: protectedProcedure
    .input(UpdateUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      // Allow moderators and above to update bans
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        return AppError.forbidden(
          'You need to be at least a Moderator to update bans',
        )
      }
      const { id, ...data } = input

      const ban = await ctx.prisma.userBan.findUnique({ where: { id } })

      if (!ban) return ResourceError.userBan.notFound()

      return ctx.prisma.userBan.update({
        where: { id },
        data,
        include: {
          user: { select: { id: true, name: true, email: true } },
          bannedBy: { select: { id: true, name: true } },
          unbannedBy: { select: { id: true, name: true } },
        },
      })
    }),

  lift: protectedProcedure
    .input(LiftUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      // Allow moderators and above to lift bans
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        return AppError.forbidden(
          'You need to be at least a Moderator to lift bans',
        )
      }
      const { id, notes } = input
      const unbannedById = ctx.session.user.id

      const ban = await ctx.prisma.userBan.findUnique({ where: { id } })

      if (!ban) return ResourceError.userBan.notFound()

      if (!ban.isActive) return ResourceError.userBan.alreadyInactive()

      return ctx.prisma.userBan.update({
        where: { id },
        data: {
          isActive: false,
          unbannedAt: new Date(),
          unbannedById,
          notes: notes
            ? `${ban.notes || ''}\n\nUnban notes: ${notes}`
            : ban.notes,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bannedBy: { select: { id: true, name: true } },
          unbannedBy: { select: { id: true, name: true } },
        },
      })
    }),

  checkUserBanStatus: publicProcedure
    .input(CheckUserBanStatusSchema)
    .query(async ({ ctx, input }) => {
      const activeBan = await ctx.prisma.userBan.findFirst({
        where: {
          userId: input.userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { bannedBy: { select: { name: true } } },
      })

      return {
        isBanned: !!activeBan,
        ban: activeBan,
      }
    }),

  delete: protectedProcedure
    .input(DeleteUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      // Allow moderators and above to delete bans
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        return AppError.forbidden(
          'You need to be at least a Moderator to delete bans',
        )
      }
      const ban = await ctx.prisma.userBan.findUnique({
        where: { id: input.id },
      })

      return ban
        ? ctx.prisma.userBan.delete({ where: { id: input.id } })
        : ResourceError.userBan.notFound()
    }),
})
