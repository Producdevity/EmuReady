import { AppError } from '@/lib/errors'
import { TRUST_LEVELS } from '@/lib/trust/config'
import {
  applyManualTrustAdjustment,
  applyMonthlyActiveBonus,
} from '@/lib/trust/service'
import {
  GetTrustLogsSchema,
  GetTrustStatsSchema,
  ManualTrustAdjustmentSchema,
  RunMonthlyActiveBonusSchema,
} from '@/schemas/trust'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { prisma } from '@/server/db'
import { hasPermission } from '@/utils/permissions'
import { type Prisma, Role } from '@orm'

export const trustRouter = createTRPCRouter({
  // Get trust logs for admin dashboard (SUPER_ADMIN only)
  getTrustLogs: protectedProcedure
    .input(GetTrustLogsSchema)
    .query(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      const { page, limit, sortField, sortDirection, search, action } = input
      const offset = (page - 1) * limit

      // Build where clause
      const where: Prisma.TrustActionLogWhereInput = {}
      if (search) {
        where.user = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      }
      if (action) {
        where.action = action
      }

      // Build orderBy clause
      const orderBy: Prisma.TrustActionLogOrderByWithRelationInput = {}
      if (sortField && sortDirection) {
        if (sortField === 'createdAt') {
          orderBy.createdAt = sortDirection
        } else if (sortField === 'action') {
          orderBy.action = sortDirection
        } else if (sortField === 'weight') {
          orderBy.weight = sortDirection
        } else if (sortField === 'user.trustScore') {
          orderBy.user = { trustScore: sortDirection }
        }
      } else {
        orderBy.createdAt = 'desc'
      }

      const [logs, total] = await Promise.all([
        prisma.trustActionLog.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, email: true, trustScore: true },
            },
          },
        }),
        prisma.trustActionLog.count({ where }),
      ])

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }),

  // Get trust system statistics (SUPER_ADMIN only)
  getTrustStats: protectedProcedure
    .input(GetTrustStatsSchema)
    .query(async ({ ctx }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      const [totalActions, totalUsers, levelDistribution] = await Promise.all([
        prisma.trustActionLog.count(),
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['trustScore'],
          _count: {
            id: true,
          },
          orderBy: {
            trustScore: 'asc',
          },
        }),
      ])

      // Convert level distribution to a more useful format
      const levelCounts = TRUST_LEVELS.map((level, index) => {
        const nextLevel = TRUST_LEVELS[index + 1]
        const count = levelDistribution
          .filter((item) => {
            return (
              item.trustScore >= level.minScore &&
              (!nextLevel || item.trustScore < nextLevel.minScore)
            )
          })
          .reduce((sum, item) => sum + item._count.id, 0)

        return {
          name: level.name,
          minScore: level.minScore,
          count,
        }
      })

      return {
        totalActions,
        totalUsers,
        levelDistribution: levelCounts,
      }
    }),

  // Run monthly active bonus (SUPER_ADMIN only)
  runMonthlyActiveBonus: protectedProcedure
    .input(RunMonthlyActiveBonusSchema)
    .mutation(async ({ ctx }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      return await applyMonthlyActiveBonus()
    }),

  // Manual trust score adjustment (SUPER_ADMIN only)
  adjustTrustScore: protectedProcedure
    .input(ManualTrustAdjustmentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      await applyManualTrustAdjustment({
        userId: input.userId,
        adjustment: input.adjustment,
        reason: input.reason,
        adminUserId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Trust level configuration
  getTrustLevels: protectedProcedure.query(() => {
    return TRUST_LEVELS
  }),
})
