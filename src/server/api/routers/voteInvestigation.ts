import {
  GetUserVotesSchema,
  GetVotesOnAuthorListingsSchema,
  GetVotePatternAnalysisSchema,
  NullifyUserVotesSchema,
  RestoreUserVotesSchema,
} from '@/schemas/voteInvestigation'
import { createTRPCRouter, permissionProcedure } from '@/server/api/trpc'
import {
  getUserVotes,
  getVotesOnAuthorListings,
  analyzeVotePatterns,
} from '@/server/services/vote-investigation.service'
import { nullifyUserVotes, restoreUserVotes } from '@/server/services/vote-nullification.service'
import { withRetryTransaction } from '@/server/utils/transactions'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { PERMISSIONS } from '@/utils/permission-system'
import { Prisma } from '@orm/client'

const manageBansProcedure = permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)

export const voteInvestigationRouter = createTRPCRouter({
  getUserVotes: manageBansProcedure.input(GetUserVotesSchema).query(async ({ ctx, input }) => {
    return getUserVotes(ctx.prisma, input)
  }),

  getVotesOnAuthorListings: manageBansProcedure
    .input(GetVotesOnAuthorListingsSchema)
    .query(async ({ ctx, input }) => {
      return getVotesOnAuthorListings(ctx.prisma, input)
    }),

  analyzePatterns: manageBansProcedure
    .input(GetVotePatternAnalysisSchema)
    .query(async ({ ctx, input }) => {
      return analyzeVotePatterns(ctx.prisma, input.userId)
    }),

  nullifyVotes: manageBansProcedure
    .input(NullifyUserVotesSchema)
    .mutation(async ({ ctx, input }) => {
      const committed = await withRetryTransaction(
        ctx.prisma,
        async (tx) => {
          const changes: TrustScoreChange[] = []
          const result = await nullifyUserVotes(tx, {
            trustChanges: changes,
            userId: input.userId,
            adminUserId: ctx.session.user.id,
            reason: input.reason,
            includeCommentVotes: input.includeCommentVotes,
            headers: ctx.headers,
          })
          return { result, changes }
        },
        { timeout: 120_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      for (const change of committed.changes) trackTrustScoreChange(change)
      return committed.result
    }),

  restoreVotes: manageBansProcedure
    .input(RestoreUserVotesSchema)
    .mutation(async ({ ctx, input }) => {
      const committed = await withRetryTransaction(
        ctx.prisma,
        async (tx) => {
          const changes: TrustScoreChange[] = []
          const result = await restoreUserVotes(tx, {
            trustChanges: changes,
            userId: input.userId,
            adminUserId: ctx.session.user.id,
            reason: input.reason,
            headers: ctx.headers,
          })
          return { result, changes }
        },
        { timeout: 120_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      for (const change of committed.changes) trackTrustScoreChange(change)
      return committed.result
    }),
})
