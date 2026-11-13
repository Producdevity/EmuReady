import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { paginate } from '@/server/utils/pagination'
import { Prisma } from '@orm'
import type { GetTrustLogsSchema } from '@/schemas/trust'
import type { z } from 'zod'

const TRUST_LOG_SELECT = {
  id: true,
  action: true,
  weight: true,
  metadata: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, trustScore: true } },
} as const satisfies Prisma.TrustActionLogSelect

export class TrustAdminRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async listLogs(input: z.output<typeof GetTrustLogsSchema>) {
    const where: Prisma.TrustActionLogWhereInput = {}
    if (input.search) {
      where.user = {
        OR: [
          { name: { contains: input.search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: input.search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    }
    if (input.action) where.action = input.action

    let orderBy: Prisma.TrustActionLogOrderByWithRelationInput = {
      createdAt: Prisma.SortOrder.desc,
    }
    if (input.sortField && input.sortDirection) {
      orderBy =
        input.sortField === 'user.trustScore'
          ? { user: { trustScore: input.sortDirection } }
          : { [input.sortField]: input.sortDirection }
    }

    const [logs, total] = await Promise.all([
      this.prisma.trustActionLog.findMany({
        where,
        orderBy,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: TRUST_LOG_SELECT,
      }),
      this.prisma.trustActionLog.count({ where }),
    ])

    return { logs, pagination: paginate({ total, page: input.page, limit: input.limit }) }
  }

  async statistics() {
    const [totalActions, totalUsers, scoreDistribution] = await Promise.all([
      this.prisma.trustActionLog.count(),
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['trustScore'],
        _count: { id: true },
        orderBy: { trustScore: Prisma.SortOrder.asc },
      }),
    ])

    return { totalActions, totalUsers, scoreDistribution }
  }
}
