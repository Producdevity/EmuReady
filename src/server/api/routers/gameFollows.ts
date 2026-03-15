import { AppError } from '@/lib/errors'
import {
  FollowGameSchema,
  GetBulkGameFollowStatusesSchema,
  GetFollowedGamesSchema,
  GetGameFollowCountsSchema,
  IsFollowingGameSchema,
  UnfollowGameSchema,
} from '@/schemas/gameFollow'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { GameFollowRepository } from '@/server/repositories/game-follow.repository'
import { isUserBanned } from '@/server/utils/query-builders'

export const gameFollowsRouter = createTRPCRouter({
  follow: protectedProcedure.input(FollowGameSchema).mutation(async ({ ctx, input }) => {
    if (await isUserBanned(ctx.prisma, ctx.session.user.id)) return AppError.shadowBanned()
    const repo = new GameFollowRepository(ctx.prisma)
    await repo.follow(ctx.session.user.id, input.gameId)
    return { success: true }
  }),

  unfollow: protectedProcedure.input(UnfollowGameSchema).mutation(async ({ ctx, input }) => {
    const repo = new GameFollowRepository(ctx.prisma)
    await repo.unfollow(ctx.session.user.id, input.gameId)
    return { success: true }
  }),

  isFollowing: publicProcedure.input(IsFollowingGameSchema).query(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) return { isFollowing: false }
    const repo = new GameFollowRepository(ctx.prisma)
    return { isFollowing: await repo.isFollowing(ctx.session.user.id, input.gameId) }
  }),

  getBulkFollowStatuses: publicProcedure
    .input(GetBulkGameFollowStatusesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new GameFollowRepository(ctx.prisma)
      const statuses = await repo.getBulkFollowStatuses(ctx.session.user.id, input.gameIds)
      return { statuses }
    }),

  getFollowedGames: publicProcedure.input(GetFollowedGamesSchema).query(async ({ ctx, input }) => {
    const repo = new GameFollowRepository(ctx.prisma)
    return repo.list(
      input.userId,
      input.page,
      input.limit,
      {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      },
      input.search,
      input.systemId,
    )
  }),

  getGameFollowCount: publicProcedure
    .input(GetGameFollowCountsSchema)
    .query(async ({ ctx, input }) => {
      const repo = new GameFollowRepository(ctx.prisma)
      return repo.counts(input.userId, {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      })
    }),
})
