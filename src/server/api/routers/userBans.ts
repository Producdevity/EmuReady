import { z } from 'zod'
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
import { UserBansRepository } from '@/server/repositories/user-bans.repository'
import { logAudit, buildDiff } from '@/server/services/audit.service'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { AuditAction, AuditEntityType, Role } from '@orm'

export const userBansRouter = createTRPCRouter({
  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
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

  get: viewUserBansProcedure.input(GetUserBansSchema).query(async ({ ctx, input }) => {
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
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModerator()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { userId, reason, notes, expiresAt } = input
    if (userId === ctx.session.user.id) return ResourceError.userBan.insufficientPermissions()
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

    if (expiresAt && expiresAt <= new Date()) {
      return AppError.badRequest('Expiration date must be in the future')
    }

    const created = await repository.create({
      userId,
      bannedById,
      reason,
      notes,
      expiresAt,
    })
    // Fire-and-forget audit log
    void logAudit(ctx.prisma, {
      actorId: ctx.session.user.id,
      action: AuditAction.BAN,
      entityType: AuditEntityType.USER_BAN,
      entityId: created.id,
      targetUserId: userId,
      metadata: { reason, expiresAt },
      headers: ctx.headers,
    })
    return created
  }),

  update: protectedProcedure.input(UpdateUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to update bans
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModeratorToUpdate()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { id, ...data } = input

    const ban = await repository.byId(id)
    if (!ban) return ResourceError.userBan.notFound()

    // Enforce hierarchy: actor must be higher than target user
    const targetRole = await repository.getUserRole(ban.userId)
    // repository.canBanUser expects (bannerRole, targetRole)
    if (!targetRole || !repository.canBanUser(ctx.session.user.role, targetRole)) {
      return ResourceError.userBan.insufficientPermissions()
    }

    // Do not allow changing isActive here
    if (typeof (data as { isActive?: boolean }).isActive !== 'undefined') {
      return AppError.operationNotAllowed('Use lift endpoint to change ban status')
    }

    if (
      (data as { expiresAt?: Date }).expiresAt &&
      (data as { expiresAt: Date }).expiresAt <= new Date()
    ) {
      return AppError.badRequest('Expiration date must be in the future')
    }

    const prev = {
      reason: ban.reason,
      notes: ban.notes ?? null,
      expiresAt: ban.expiresAt,
      isActive: ban.isActive,
    }

    const updated = await repository.update(id, data)
    const next = {
      reason: updated.reason,
      notes: updated.notes ?? null,
      expiresAt: updated.expiresAt,
      isActive: updated.isActive,
    }

    void logAudit(ctx.prisma, {
      actorId: ctx.session.user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER_BAN,
      entityId: id,
      targetUserId: updated.user.id,
      metadata: {
        fieldsUpdated: Object.keys(data as Record<string, unknown>),
        diff: buildDiff(prev, next),
      },
      headers: ctx.headers,
    })
    return updated
  }),

  lift: protectedProcedure.input(LiftUserBanSchema).mutation(async ({ ctx, input }) => {
    // Allow moderators and above to lift bans
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.userBan.requiresModeratorToLift()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const { id, notes } = input
    const unbannedById = ctx.session.user.id

    const ban = await repository.byId(id)
    if (!ban) return ResourceError.userBan.notFound()
    if (!ban.isActive) return ResourceError.userBan.alreadyInactive()

    // Hierarchy check for lifting
    {
      const targetRole = await repository.getUserRole(ban.userId)
      if (!targetRole || !repository.canBanUser(ctx.session.user.role, targetRole)) {
        return ResourceError.userBan.insufficientPermissions()
      }
    }

    const prev = {
      reason: ban.reason,
      notes: ban.notes ?? null,
      expiresAt: ban.expiresAt,
      isActive: ban.isActive,
    }

    const lifted = await repository.lift(id, unbannedById, notes)
    const next = {
      reason: lifted.reason,
      notes: lifted.notes ?? null,
      expiresAt: lifted.expiresAt,
      isActive: lifted.isActive,
    }

    void logAudit(ctx.prisma, {
      actorId: ctx.session.user.id,
      action: AuditAction.UNBAN,
      entityType: AuditEntityType.USER_BAN,
      entityId: id,
      targetUserId: lifted.user.id,
      metadata: { notes: notes || undefined, diff: buildDiff(prev, next) },
      headers: ctx.headers,
    })
    return lifted
  }),

  checkUserBanStatus: publicProcedure
    .input(CheckUserBanStatusSchema)
    .query(async ({ ctx, input }) => {
      const repository = new UserBansRepository(ctx.prisma)
      return await repository.checkBanStatus(input.userId, true)
    }),

  delete: protectedProcedure.input(DeleteUserBanSchema).mutation(async ({ ctx, input }) => {
    // Only ADMIN and SUPER_ADMIN can archive (soft-delete) bans
    if (!hasRolePermission(ctx.session.user.role, Role.ADMIN)) {
      return ResourceError.userBan.requiresModeratorToDelete()
    }

    const repository = new UserBansRepository(ctx.prisma)
    const ban = await repository.byId(input.id)

    if (!ban) return ResourceError.userBan.notFound()

    // Enforce hierarchy: actor must outrank target
    const targetRole = await repository.getUserRole(ban.userId)
    if (!targetRole || !repository.canBanUser(ctx.session.user.role, targetRole)) {
      return ResourceError.userBan.insufficientPermissions()
    }

    // Mark as archived: keep the record, ensure it's inactive, append archive note
    const archiveNote = `Archived by ${ctx.session.user.id} on ${new Date().toISOString()}`

    const prev = {
      reason: ban.reason,
      notes: ban.notes ?? null,
      expiresAt: ban.expiresAt,
      isActive: ban.isActive,
    }

    const archived = await repository.update(input.id, {
      isActive: false,
      unbannedAt: ban.unbannedAt ?? new Date(),
      unbannedBy: ban.unbannedById
        ? undefined
        : {
            connect: { id: ctx.session.user.id },
          },
      notes: ban.notes ? `${ban.notes}\n\n${archiveNote}` : archiveNote,
    })
    const next = {
      reason: archived.reason,
      notes: archived.notes ?? null,
      expiresAt: archived.expiresAt,
      isActive: archived.isActive,
    }
    void logAudit(ctx.prisma, {
      actorId: ctx.session.user.id,
      action: AuditAction.ARCHIVE,
      entityType: AuditEntityType.USER_BAN,
      entityId: input.id,
      targetUserId: archived.user.id,
      metadata: { archived: true, diff: buildDiff(prev, next) },
      headers: ctx.headers,
    })
    return archived
  }),

  // Detailed related reports for the banned user's authored content
  getUserReports: viewUserBansProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input

      const [listingReports, pcListingReports] = await Promise.all([
        ctx.prisma.listingReport.findMany({
          where: { listing: { authorId: userId } },
          include: {
            reportedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
            listing: {
              select: {
                id: true,
                game: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
        ctx.prisma.pcListingReport.findMany({
          where: { pcListing: { authorId: userId } },
          include: {
            reportedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
            pcListing: {
              select: {
                id: true,
                game: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
      ])

      return { listingReports, pcListingReports }
    }),
})
