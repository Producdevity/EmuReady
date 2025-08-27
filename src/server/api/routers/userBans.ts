import { ResourceError } from '@/lib/errors'
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
import { UserBansRepository } from '@/server/repositories/user-bans.repository'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

export const userBansRouter = createTRPCRouter({
  getStats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const repository = new UserBansRepository(ctx.prisma)
    const stats = await repository.stats()

    return {
      total: stats.total,
      active: stats.active,
      expired: stats.expired,
      permanent: stats.permanent,
      temporary: stats.temporary,
    }
  }),

  getAll: viewUserBansProcedure.input(GetUserBansSchema).query(async ({ ctx, input }) => {
    const repository = new UserBansRepository(ctx.prisma)

    return await repository.list({
      page: input?.page,
      limit: input?.limit,
      search: input?.search,
      isActive: input?.isActive,
      sortField: input?.sortField || 'createdAt',
      sortDirection: input?.sortDirection || 'desc',
    })
  }),

  getById: viewUserBansProcedure.input(GetUserBanByIdSchema).query(async ({ ctx, input }) => {
    const repository = new UserBansRepository(ctx.prisma)
    const ban = await repository.byId(input.id, true)

    return ban ?? ResourceError.userBan.notFound()
  }),

  create: protectedProcedure.input(CreateUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to create bans
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModerator()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { userId, reason, notes, expiresAt } = input
    const bannedById = ctx.session.user.id

    // Check if user exists and get their role
    const userRole = await repository.getUserRole(userId)
    if (!userRole) return ResourceError.user.notFound()

    // Prevent banning admins or higher roles
    if (!repository.canBanUser(ctx.session.user.role, userRole)) {
      return ResourceError.userBan.cannotBanHigherRole()
    }

    // Check if user already has an active ban
    const { isBanned } = await repository.checkBanStatus(userId)
    if (isBanned) return ResourceError.userBan.alreadyBanned()

    return await repository.create({
      userId,
      bannedById,
      reason,
      notes,
      expiresAt,
    })
  }),

  update: protectedProcedure.input(UpdateUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to update bans
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModeratorToUpdate()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { id, ...data } = input

    const ban = await repository.byId(id)
    if (!ban) return ResourceError.userBan.notFound()

    return await repository.update(id, data)
  }),

  lift: protectedProcedure.input(LiftUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to lift bans
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModeratorToLift()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { id, notes } = input
    const unbannedById = ctx.session.user.id

    const ban = await repository.byId(id)
    if (!ban) return ResourceError.userBan.notFound()
    if (!ban.isActive) return ResourceError.userBan.alreadyInactive()

    return await repository.lift(id, unbannedById, notes)
  }),

  checkUserBanStatus: publicProcedure
    .input(CheckUserBanStatusSchema)
    .query(async ({ ctx, input }) => {
      const repository = new UserBansRepository(ctx.prisma)
      return await repository.checkBanStatus(input.userId, true)
    }),

  delete: protectedProcedure.input(DeleteUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to delete bans
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModeratorToDelete()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const ban = await repository.byId(input.id)

    if (!ban) return ResourceError.userBan.notFound()

    return await repository.delete(input.id)
  }),
})
