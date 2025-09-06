import { GetAuditLogByIdSchema, GetAuditLogsSchema } from '@/schemas/audit'
import { createTRPCRouter, permissionProcedure } from '@/server/api/trpc'
import { AuditLogsRepository } from '@/server/repositories/audit-logs.repository'
import { PERMISSIONS } from '@/utils/permission-system'

export const auditLogsRouter = createTRPCRouter({
  get: permissionProcedure(PERMISSIONS.VIEW_LOGS)
    .input(GetAuditLogsSchema)
    .query(async ({ ctx, input }) => {
      const repository = new AuditLogsRepository(ctx.prisma)
      return await repository.list({
        ...input,
        sortField: input?.sortField ?? 'createdAt',
        sortDirection: input?.sortDirection ?? 'desc',
      })
    }),

  stats: permissionProcedure(PERMISSIONS.VIEW_LOGS).query(async ({ ctx }) => {
    const repository = new AuditLogsRepository(ctx.prisma)
    const summary = await repository.stats()
    return { summary }
  }),

  byId: permissionProcedure(PERMISSIONS.VIEW_LOGS)
    .input(GetAuditLogByIdSchema)
    .query(async ({ ctx, input }) => {
      const repository = new AuditLogsRepository(ctx.prisma)
      return await repository.byId(input.id)
    }),
})
