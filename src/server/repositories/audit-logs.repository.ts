import {
  paginate,
  calculateOffset,
  buildSearchConditions,
  contains,
} from '@/server/utils/pagination'
import { ms } from '@/utils/time'
import { BaseRepository } from './base.repository'
import type { Prisma, PrismaClient, AuditAction, AuditEntityType } from '@orm'

export class AuditLogsRepository extends BaseRepository {
  static readonly includes = {
    default: {
      actor: { select: { id: true, name: true, email: true, role: true } },
      targetUser: { select: { id: true, name: true, email: true, role: true } },
    } satisfies Prisma.AuditLogInclude,
  } as const

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma as PrismaClient)
  }

  async create(data: {
    actorId?: string | null
    action: AuditAction
    entityType: AuditEntityType
    entityId?: string | null
    targetUserId?: string | null
    metadata?: Prisma.InputJsonValue | null
    ipAddress?: string | null
    userAgent?: string | null
    requestId?: string | null
  }) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.auditLog.create({
          data: {
            actorId: data.actorId ?? null,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId ?? null,
            targetUserId: data.targetUserId ?? null,
            metadata: data.metadata ?? undefined,
            ipAddress: data.ipAddress ?? null,
            userAgent: data.userAgent ?? null,
            requestId: data.requestId ?? null,
          },
        }),
      'AuditLog',
    )
  }

  async stats() {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - ms.days(1))
    const last7Days = new Date(now.getTime() - ms.days(7))
    const last30Days = new Date(now.getTime() - ms.days(30))

    const [totalLogs, logsLast24h, logsLast7d, logsLast30d] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: last24Hours } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: last30Days } } }),
    ])

    return { totalLogs, logsLast24h, logsLast7d, logsLast30d }
  }

  async list(params: {
    page?: number
    limit?: number
    search?: string
    action?: AuditAction
    entityType?: AuditEntityType
    actorId?: string
    targetUserId?: string
    dateFrom?: string
    dateTo?: string
    sortField?: 'createdAt' | 'action' | 'entityType' | 'actorId' | 'targetUserId'
    sortDirection?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 50,
      search,
      action,
      entityType,
      actorId,
      targetUserId,
      dateFrom,
      dateTo,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params

    const actualOffset = calculateOffset({ page }, limit)

    const where: Prisma.AuditLogWhereInput = {}

    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (actorId) where.actorId = actorId
    if (targetUserId) where.targetUserId = targetUserId

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    if (search && search.trim()) {
      const term = search.trim()
      where.OR = buildSearchConditions<Prisma.AuditLogWhereInput>(term, [
        (s) => ({ actor: contains('name', s) as never }),
        (s) => ({ actor: contains('email', s) as never }),
        (s) => ({ targetUser: contains('name', s) as never }),
        (s) => ({ targetUser: contains('email', s) as never }),
        (s) => ({ entityId: { contains: s, mode: 'insensitive' } }),
        (s) => ({ requestId: { contains: s, mode: 'insensitive' } }),
        (s) => ({ ipAddress: { contains: s, mode: 'insensitive' } }),
        (s) => ({ userAgent: { contains: s, mode: 'insensitive' } }),
      ])
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: actualOffset,
        take: limit,
        orderBy: { [sortField]: sortDirection },
        include: AuditLogsRepository.includes.default,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: paginate({ total, page, limit }),
    }
  }

  async byId(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: AuditLogsRepository.includes.default,
    })
  }
}
