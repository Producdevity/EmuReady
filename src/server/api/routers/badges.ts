import { AppError, ResourceError } from '@/lib/errors'
import {
  AssignBadgeToUserSchema,
  BulkAssignBadgesSchema,
  BulkRemoveBadgesSchema,
  CreateBadgeSchema,
  DeleteBadgeSchema,
  GetBadgeSchema,
  GetBadgesSchema,
  GetUserBadgesSchema,
  RemoveBadgeFromUserSchema,
  UpdateBadgeSchema,
} from '@/schemas/badge'
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { hasPermission } from '@/utils/permissions'
import { type Prisma, Role } from '@orm'

export const badgesRouter = createTRPCRouter({
  // Get all badges (admin only)
  getAll: adminProcedure.input(GetBadgesSchema).query(async ({ ctx, input }) => {
    const {
      limit,
      offset,
      search,
      isActive,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = input

    const where: Prisma.BadgeWhereInput = {}

    // Apply search filter
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Apply active filter
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Build order by
    const orderBy: Prisma.BadgeOrderByWithRelationInput = {
      [sortField]: sortDirection,
    }

    const [badges, total] = await Promise.all([
      ctx.prisma.badge.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { userBadges: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      ctx.prisma.badge.count({ where }),
    ])

    return {
      badges,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }),

  // Get badge by ID (admin only)
  getById: adminProcedure.input(GetBadgeSchema).query(async ({ ctx, input }) => {
    const badge = await ctx.prisma.badge.findUnique({
      where: { id: input.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        userBadges: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            assignedByUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        _count: { select: { userBadges: true } },
      },
    })

    return badge || ResourceError.badge.notFound()
  }),

  // Create badge (admin only)
  create: adminProcedure.input(CreateBadgeSchema).mutation(async ({ ctx, input }) => {
    // Check if badge name already exists
    const existingBadge = await ctx.prisma.badge.findUnique({
      where: { name: input.name },
      select: { id: true },
    })

    if (existingBadge) return ResourceError.badge.alreadyExists(input.name)

    return await ctx.prisma.badge.create({
      data: {
        ...input,
        createdBy: ctx.session.user.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { userBadges: true } },
      },
    })
  }),

  // Update badge (admin only)
  update: adminProcedure.input(UpdateBadgeSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input

    // Check if badge exists
    const existingBadge = await ctx.prisma.badge.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!existingBadge) return ResourceError.badge.notFound()

    // Check if name is being updated and conflicts with another badge
    if (updateData.name && updateData.name !== existingBadge.name) {
      const exists = await ctx.prisma.badge.findUnique({
        where: { name: updateData.name },
        select: { id: true },
      })

      if (exists) return ResourceError.badge.alreadyExists(updateData.name)
    }

    return await ctx.prisma.badge.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { userBadges: true } },
      },
    })
  }),

  // Delete badge (admin only)
  delete: adminProcedure.input(DeleteBadgeSchema).mutation(async ({ ctx, input }) => {
    // Check if badge exists
    const existingBadge = await ctx.prisma.badge.findUnique({
      where: { id: input.id },
      select: { id: true, _count: { select: { userBadges: true } } },
    })

    if (!existingBadge) return ResourceError.badge.notFound()

    // Check if badge is assigned to any users
    if (existingBadge._count.userBadges > 0) {
      return ResourceError.badge.inUse(existingBadge._count.userBadges)
    }

    await ctx.prisma.badge.delete({ where: { id: input.id } })

    return { success: true }
  }),

  // Get badge stats (admin only)
  getStats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [total, active, inactive, totalAssignments] = await Promise.all([
      ctx.prisma.badge.count(),
      ctx.prisma.badge.count({ where: { isActive: true } }),
      ctx.prisma.badge.count({ where: { isActive: false } }),
      ctx.prisma.userBadge.count(),
    ])

    return {
      total,
      active,
      inactive,
      totalAssignments,
    }
  }),

  // Assign badge to user (admin only)
  assignToUser: adminProcedure.input(AssignBadgeToUserSchema).mutation(async ({ ctx, input }) => {
    const { userId, badgeId, notes, color } = input

    // Check if user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) return ResourceError.user.notInDatabase(userId)

    // Check if badge exists and is active
    const badge = await ctx.prisma.badge.findUnique({
      where: { id: badgeId },
      select: { id: true, name: true, isActive: true },
    })

    if (!badge) return ResourceError.badge.notFound()

    if (!badge.isActive) return ResourceError.badge.inactive()

    // Check if user already has this badge
    const existingAssignment = await ctx.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
      select: { id: true },
    })

    if (existingAssignment) return ResourceError.badge.alreadyAssigned()

    return await ctx.prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        assignedBy: ctx.session.user.id,
        notes,
        color,
      },
      include: {
        badge: true,
        user: { select: { id: true, name: true, email: true } },
        assignedByUser: { select: { id: true, name: true, email: true } },
      },
    })
  }),

  // Remove badge from user (admin only)
  removeFromUser: adminProcedure
    .input(RemoveBadgeFromUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, userBadgeId } = input

      // Check if assignment exists and belongs to the user
      const existingAssignment = await ctx.prisma.userBadge.findUnique({
        where: { id: userBadgeId },
        select: { id: true, userId: true },
      })

      if (!existingAssignment) return ResourceError.badge.notAssigned()

      if (existingAssignment.userId !== userId) {
        return AppError.badRequest('User badge assignment does not belong to the specified user')
      }

      await ctx.prisma.userBadge.delete({
        where: { id: userBadgeId },
      })

      return { success: true }
    }),

  // Get user badges (protected - users can see their own, admins can see any)
  getUserBadges: protectedProcedure.input(GetUserBadgesSchema).query(async ({ ctx, input }) => {
    const { userId } = input

    // Check permissions - users can only see their own badges
    if (userId !== ctx.session.user.id && !hasPermission(ctx.session.user.role, Role.ADMIN)) {
      return AppError.insufficientRole()
    }

    return await ctx.prisma.userBadge.findMany({
      /* Only show active badges */
      where: { userId, badge: { isActive: true } },
      include: {
        badge: true,
        assignedByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { assignedAt: 'desc' },
    })
  }),

  // Bulk assign badges (admin only)
  bulkAssign: adminProcedure.input(BulkAssignBadgesSchema).mutation(async ({ ctx, input }) => {
    const { userIds, badgeId, notes } = input

    // Check if badge exists and is active
    const badge = await ctx.prisma.badge.findUnique({
      where: { id: badgeId },
      select: { id: true, name: true, isActive: true },
    })

    if (!badge) return ResourceError.badge.notFound()

    if (!badge.isActive) return ResourceError.badge.inactive()

    // Check if users exist
    const users = await ctx.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })

    if (users.length !== userIds.length) {
      return AppError.badRequest('One or more users not found')
    }

    // Get existing assignments to avoid duplicates
    const existingAssignments = await ctx.prisma.userBadge.findMany({
      where: {
        userId: { in: userIds },
        badgeId,
      },
      select: { userId: true },
    })

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId))
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id))

    if (newUserIds.length === 0) {
      return AppError.badRequest('All selected users already have this badge')
    }

    // Create assignments
    const assignments = await ctx.prisma.userBadge.createMany({
      data: newUserIds.map((userId) => ({
        userId,
        badgeId,
        assignedBy: ctx.session.user.id,
        notes,
      })),
    })

    return {
      success: true,
      assignedCount: assignments.count,
      skippedCount: userIds.length - assignments.count,
    }
  }),

  // Bulk remove badges (admin only)
  bulkRemove: adminProcedure.input(BulkRemoveBadgesSchema).mutation(async ({ ctx, input }) => {
    const { userIds, badgeId } = input

    // Remove assignments
    const result = await ctx.prisma.userBadge.deleteMany({
      where: { userId: { in: userIds }, badgeId },
    })

    return { success: true, removedCount: result.count }
  }),
})
