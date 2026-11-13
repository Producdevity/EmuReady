import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { ReportHistoryRepository } from './history.repository'
import { GetReportHistorySchema, ReportHistoryOutputSchema } from '../shared/history.schemas'

export const reportHistoryRouter = createTRPCRouter({
  get: protectedProcedure
    .input(GetReportHistorySchema)
    .output(ReportHistoryOutputSchema)
    .query(({ ctx, input }) =>
      new ReportHistoryRepository(ctx.prisma).list(ctx.session.user.id, input),
    ),
})
