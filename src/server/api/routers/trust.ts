import { TRUST_LEVELS } from '@/lib/trust/config'
import { TrustService, applyMonthlyActiveBonus } from '@/lib/trust/service'
import {
  GetTrustLogsSchema,
  GetTrustStatsSchema,
  ManualTrustAdjustmentSchema,
  RunMonthlyActiveBonusSchema,
} from '@/schemas/trust'
import { createTRPCRouter, protectedProcedure, superAdminProcedure } from '@/server/api/trpc'
import { TrustAdminRepository } from '@/server/repositories/trust-admin.repository'
import { TrustAdminService } from '@/server/services/trust-admin.service'

export const trustRouter = createTRPCRouter({
  getTrustLogs: superAdminProcedure.input(GetTrustLogsSchema).query(async ({ ctx, input }) => {
    return new TrustAdminRepository(ctx.prisma).listLogs(input)
  }),

  getTrustStats: superAdminProcedure.input(GetTrustStatsSchema).query(async ({ ctx }) => {
    const repository = new TrustAdminRepository(ctx.prisma)
    return new TrustAdminService(repository).statistics()
  }),

  runMonthlyActiveBonus: superAdminProcedure
    .input(RunMonthlyActiveBonusSchema)
    .mutation(async () => applyMonthlyActiveBonus()),

  adjustTrustScore: superAdminProcedure
    .input(ManualTrustAdjustmentSchema)
    .mutation(async ({ ctx, input }) => {
      await new TrustService(ctx.prisma).applyManualAdjustment({
        userId: input.userId,
        adjustment: input.adjustment,
        reason: input.reason,
        adminUserId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Trust level configuration
  getTrustLevels: protectedProcedure.query(() => TRUST_LEVELS),
})
