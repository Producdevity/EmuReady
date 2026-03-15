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
import { PERMISSIONS } from '@/utils/permission-system'

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
      return nullifyUserVotes(ctx.prisma, {
        userId: input.userId,
        adminUserId: ctx.session.user.id,
        reason: input.reason,
        includeCommentVotes: input.includeCommentVotes,
        headers: ctx.headers,
      })
    }),

  restoreVotes: manageBansProcedure
    .input(RestoreUserVotesSchema)
    .mutation(async ({ ctx, input }) => {
      return restoreUserVotes(ctx.prisma, {
        userId: input.userId,
        adminUserId: ctx.session.user.id,
        reason: input.reason,
        headers: ctx.headers,
      })
    }),
})
