import { AdminGrantEntitlementSchema, AdminRevokeEntitlementSchema } from '@/schemas/entitlements'
import {
  ListEntitlementsByUserSchema,
  ListEntitlementsSchema,
  EntitlementsStatsSchema,
} from '@/schemas/entitlementsAdmin'
import { createTRPCRouter, adminProcedure } from '@/server/api/trpc'
import { EntitlementsRepository } from '@/server/repositories/entitlements.repository'
import { EntitlementStatus } from '@orm'
import { type Prisma } from '@orm'

export const adminEntitlementsRouter = createTRPCRouter({
  grant: adminProcedure.input(AdminGrantEntitlementSchema).mutation(async ({ ctx, input }) => {
    const repo = new EntitlementsRepository(ctx.prisma)
    return repo.grant(input.userId, input.source, {
      referenceId: input.referenceId,
      notes: input.notes,
    })
  }),

  revoke: adminProcedure.input(AdminRevokeEntitlementSchema).mutation(async ({ ctx, input }) => {
    const repo = new EntitlementsRepository(ctx.prisma)
    return repo.revoke(input.entitlementId, { requestingUserRole: ctx.session?.user.role })
  }),
  restore: adminProcedure.input(AdminRevokeEntitlementSchema).mutation(async ({ ctx, input }) => {
    const repo = new EntitlementsRepository(ctx.prisma)
    return repo.restore(input.entitlementId, { requestingUserRole: ctx.session?.user.role })
  }),
  listByUser: adminProcedure.input(ListEntitlementsByUserSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.entitlement.findMany({
      where: { userId: input.userId },
      orderBy: { grantedAt: 'desc' },
    })
  }),

  list: adminProcedure.input(ListEntitlementsSchema).query(async ({ ctx, input }) => {
    const conditions: Prisma.EntitlementWhereInput[] = []
    if (input.source) conditions.push({ source: input.source })
    if (input.status) conditions.push({ status: input.status })
    if (input.search) {
      conditions.push({
        OR: [
          { referenceId: { contains: input.search, mode: 'insensitive' } },
          { user: { email: { contains: input.search, mode: 'insensitive' } } },
          { user: { name: { contains: input.search, mode: 'insensitive' } } },
        ],
      })
    }
    const where = conditions.length ? { AND: conditions } : {}

    const orderBy = (() => {
      switch (input.sortField) {
        case 'revokedAt':
          return { revokedAt: input.sortDirection }
        case 'source':
          return { source: input.sortDirection }
        case 'status':
          return { status: input.sortDirection }
        case 'userEmail':
          return { user: { email: input.sortDirection } }
        case 'userName':
          return { user: { name: input.sortDirection } }
        case 'grantedAt':
        default:
          return { grantedAt: input.sortDirection }
      }
    })()

    const [total, items] = await Promise.all([
      ctx.prisma.entitlement.count({ where }),
      ctx.prisma.entitlement.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
        orderBy,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ])

    return {
      items,
      pagination: {
        total,
        page: input.page,
        limit: input.limit,
        pages: Math.max(1, Math.ceil(total / input.limit)),
        hasNextPage: input.page * input.limit < total,
        hasPreviousPage: input.page > 1,
      },
    }
  }),

  stats: adminProcedure.input(EntitlementsStatsSchema).query(async ({ ctx }) => {
    const [total, active, revoked, bySource] = await Promise.all([
      ctx.prisma.entitlement.count(),
      ctx.prisma.entitlement.count({ where: { status: EntitlementStatus.ACTIVE } }),
      ctx.prisma.entitlement.count({ where: { status: EntitlementStatus.REVOKED } }),
      ctx.prisma.entitlement.groupBy({ by: ['source'], _count: { source: true } }),
    ])
    const sourceCounts = Object.fromEntries(bySource.map((g) => [g.source, g._count.source]))
    return { total, active, revoked, sourceCounts }
  }),
})
