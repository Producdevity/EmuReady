import { AppError } from '@/lib/errors'
import {
  GetPermissionLogsSchema,
  GetPermissionLogByIdSchema,
  GetPermissionTimelineSchema,
  GetUserPermissionActivitySchema,
  ExportPermissionLogsSchema,
} from '@/schemas/permission'
import { createTRPCRouter, permissionProcedure } from '@/server/api/trpc'
import { paginate } from '@/server/utils/pagination'
import { PERMISSIONS } from '@/utils/permission-system'
import { ms } from '@/utils/time'

export const permissionLogsRouter = createTRPCRouter({
  /**
   * Get permission action logs with filtering and pagination
   */
  getAll: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS)
    .input(GetPermissionLogsSchema)
    .query(async ({ ctx, input }) => {
      const {
        userId,
        action,
        targetRole,
        permissionId,
        sortField = 'createdAt',
        sortDirection = 'desc',
        page = 1,
        limit = 20,
        dateFrom,
        dateTo,
      } = input || {}

      const offset = (page - 1) * limit

      // Build where clause
      const where: Record<string, unknown> = {}

      if (userId) where.userId = userId
      if (action) where.action = action
      if (targetRole) where.targetRole = targetRole
      if (permissionId) where.permissionId = permissionId

      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      }

      // Execute queries
      const [logs, total] = await Promise.all([
        ctx.prisma.permissionActionLog.findMany({
          where,
          orderBy: { [sortField]: sortDirection },
          skip: offset,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            permission: {
              select: { id: true, key: true, label: true, category: true },
            },
          },
        }),
        ctx.prisma.permissionActionLog.count({ where }),
      ])

      return {
        logs,
        pagination: paginate({ total: total, page, limit: limit }),
      }
    }),

  /**
   * Get permission log statistics
   */
  getStats: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS).query(async ({ ctx }) => {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - ms.days(1))
    const last7Days = new Date(now.getTime() - ms.days(7))
    const last30Days = new Date(now.getTime() - ms.days(30))

    const [
      totalLogs,
      logsLast24h,
      logsLast7d,
      logsLast30d,
      actionBreakdown,
      roleBreakdown,
      recentActivity,
    ] = await Promise.all([
      // Total logs
      ctx.prisma.permissionActionLog.count(),

      // Logs in last 24 hours
      ctx.prisma.permissionActionLog.count({
        where: { createdAt: { gte: last24Hours } },
      }),

      // Logs in last 7 days
      ctx.prisma.permissionActionLog.count({
        where: { createdAt: { gte: last7Days } },
      }),

      // Logs in last 30 days
      ctx.prisma.permissionActionLog.count({
        where: { createdAt: { gte: last30Days } },
      }),

      // Action breakdown
      ctx.prisma.permissionActionLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where: { createdAt: { gte: last30Days } },
      }),

      // Role breakdown (for role-related actions)
      ctx.prisma.permissionActionLog.groupBy({
        by: ['targetRole'],
        _count: { id: true },
        where: { targetRole: { not: null }, createdAt: { gte: last30Days } },
      }),

      // Recent activity (last 10 logs)
      ctx.prisma.permissionActionLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          permission: { select: { key: true, label: true } },
        },
      }),
    ])

    return {
      summary: {
        totalLogs,
        logsLast24h,
        logsLast7d,
        logsLast30d,
        changeRate24h: logsLast24h,
        changeRate7d: logsLast7d - logsLast24h,
        changeRate30d: logsLast30d - logsLast7d,
      },
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
      roleBreakdown: roleBreakdown.map((item) => ({
        role: item.targetRole,
        count: item._count.id,
      })),
      recentActivity,
    }
  }),

  /**
   * Get log details by ID
   */
  getById: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS)
    .input(GetPermissionLogByIdSchema)
    .query(async ({ ctx, input }) => {
      const log = await ctx.prisma.permissionActionLog.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          permission: {
            select: {
              id: true,
              key: true,
              label: true,
              description: true,
              category: true,
            },
          },
        },
      })

      return log || AppError.notFound('Permission log')
    }),

  /**
   * Get permission activity timeline for a specific permission
   */
  getPermissionTimeline: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS)
    .input(GetPermissionTimelineSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.prisma.permissionActionLog.findMany({
          where: { permissionId: input.permissionId },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
    ),

  /**
   * Get user activity for permission management
   */
  getUserActivity: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS)
    .input(GetUserPermissionActivitySchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.prisma.permissionActionLog.findMany({
          where: { userId: input.userId },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          include: {
            permission: { select: { id: true, key: true, label: true } },
          },
        }),
    ),

  /**
   * Export permission logs (for audit purposes)
   */
  export: permissionProcedure(PERMISSIONS.VIEW_PERMISSION_LOGS)
    .input(ExportPermissionLogsSchema)
    .query(async ({ ctx, input }) => {
      const { format, dateFrom, dateTo, userId, action } = input

      const where: Record<string, unknown> = {}

      if (userId) where.userId = userId
      if (action) where.action = action

      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      }

      const logs = await ctx.prisma.permissionActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          permission: {
            select: { id: true, key: true, label: true, category: true },
          },
        },
      })

      // Format data based on requested format
      if (format === 'json') {
        return {
          format: 'json',
          data: logs,
          generatedAt: new Date().toISOString(),
          totalRecords: logs.length,
        }
      } else {
        // CSV format
        const headers = [
          'Date',
          'Action',
          'User Name',
          'User Email',
          'User Role',
          'Target Role',
          'Permission Key',
          'Permission Label',
          'Permission Category',
          'Metadata',
        ]

        const csvData = logs.map((log) => [
          log.createdAt.toISOString(),
          log.action,
          log.user?.name || '',
          log.user?.email || '',
          log.user?.role || '',
          log.targetRole || '',
          log.permission?.key || '',
          log.permission?.label || '',
          log.permission?.category || '',
          JSON.stringify(log.metadata || {}),
        ])

        return {
          format: 'csv',
          headers,
          data: csvData,
          generatedAt: new Date().toISOString(),
          totalRecords: logs.length,
        }
      }
    }),
})
