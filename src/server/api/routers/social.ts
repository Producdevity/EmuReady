import {
  BlockUserSchema,
  FollowUserSchema,
  GetActivityFeedSchema,
  GetBlockedUsersSchema,
  GetBulkFollowStatusesSchema,
  GetFollowersSchema,
  GetFollowingSchema,
  GetFriendRequestsSchema,
  GetFriendsSchema,
  RemoveFollowerSchema,
  RespondFriendRequestSchema,
  SendFriendRequestSchema,
  UnblockUserSchema,
  UnfollowUserSchema,
} from '@/schemas/social'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { SocialRepository } from '@/server/repositories/social.repository'

export const socialRouter = createTRPCRouter({
  // ─── Follow / Unfollow ──────────────────────────────────

  follow: protectedProcedure.input(FollowUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.follow(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  unfollow: protectedProcedure.input(UnfollowUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.unfollow(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  removeFollower: protectedProcedure
    .input(RemoveFollowerSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.removeFollower(ctx.session.user.id, input.userId)
      return { success: true }
    }),

  // ─── Follow Queries ─────────────────────────────────────

  getFollowers: publicProcedure.input(GetFollowersSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getFollowers(
      input.userId,
      input.page,
      input.limit,
      {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      },
      input.search,
    )
  }),

  getFollowing: publicProcedure.input(GetFollowingSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getFollowing(
      input.userId,
      input.page,
      input.limit,
      {
        requestingUserId: ctx.session?.user?.id,
        requestingUserRole: ctx.session?.user?.role,
      },
      input.search,
    )
  }),

  isFollowing: publicProcedure.input(FollowUserSchema).query(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) return { isFollowing: false }
    const repo = new SocialRepository(ctx.prisma)
    return { isFollowing: await repo.isFollowing(ctx.session.user.id, input.userId) }
  }),

  getFollowCounts: publicProcedure.input(FollowUserSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getFollowCounts(input.userId)
  }),

  getBulkFollowStatuses: publicProcedure
    .input(GetBulkFollowStatusesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new SocialRepository(ctx.prisma)
      const statuses = await repo.getBulkFollowStatuses(ctx.session.user.id, input.userIds)
      return { statuses }
    }),

  // ─── Friend Requests ────────────────────────────────────

  sendFriendRequest: protectedProcedure
    .input(SendFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.sendFriendRequest(ctx.session.user.id, input.userId)
      return { success: true }
    }),

  respondFriendRequest: protectedProcedure
    .input(RespondFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.respondFriendRequest(ctx.session.user.id, input.requestId, input.accept)
      return { success: true }
    }),

  getFriendRequests: protectedProcedure
    .input(GetFriendRequestsSchema)
    .query(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      return repo.getFriendRequests(ctx.session.user.id, input.direction, input.page, input.limit)
    }),

  getFriends: protectedProcedure.input(GetFriendsSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getFriends(
      input.userId,
      input.page,
      input.limit,
      {
        requestingUserId: ctx.session.user.id,
        requestingUserRole: ctx.session.user.role,
      },
      input.search,
    )
  }),

  getRelationshipStatus: publicProcedure.input(FollowUserSchema).query(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) {
      return { isFriend: false, pendingRequest: null }
    }
    const repo = new SocialRepository(ctx.prisma)
    return repo.getRelationshipStatus(ctx.session.user.id, input.userId)
  }),

  // ─── Block / Unblock ────────────────────────────────────

  blockUser: protectedProcedure.input(BlockUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.blockUser(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  unblockUser: protectedProcedure.input(UnblockUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.unblockUser(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  getBlockedUsers: protectedProcedure.input(GetBlockedUsersSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getBlockedUsers(ctx.session.user.id, input.page, input.limit, input.search)
  }),

  // ─── Activity Feed ──────────────────────────────────────

  getActivityFeed: protectedProcedure.input(GetActivityFeedSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getActivityFeed(ctx.session.user.id, input.page, input.limit, {
      scope: input.scope,
      type: input.type,
    })
  }),
})
