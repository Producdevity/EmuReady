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
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { SocialRepository } from '@/server/repositories/social.repository'

export const mobileSocialRouter = createMobileTRPCRouter({
  follow: mobileProtectedProcedure.input(FollowUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.follow(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  unfollow: mobileProtectedProcedure.input(UnfollowUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.unfollow(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  removeFollower: mobileProtectedProcedure
    .input(RemoveFollowerSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.removeFollower(ctx.session.user.id, input.userId)
      return { success: true }
    }),

  getFollowers: mobilePublicProcedure.input(GetFollowersSchema).query(async ({ ctx, input }) => {
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

  getFollowing: mobilePublicProcedure.input(GetFollowingSchema).query(async ({ ctx, input }) => {
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

  isFollowing: mobilePublicProcedure.input(FollowUserSchema).query(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) return { isFollowing: false }
    const repo = new SocialRepository(ctx.prisma)
    return { isFollowing: await repo.isFollowing(ctx.session.user.id, input.userId) }
  }),

  getFollowCounts: mobilePublicProcedure.input(FollowUserSchema).query(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    return repo.getFollowCounts(input.userId)
  }),

  getBulkFollowStatuses: mobilePublicProcedure
    .input(GetBulkFollowStatusesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) return { statuses: {} }
      const repo = new SocialRepository(ctx.prisma)
      const statuses = await repo.getBulkFollowStatuses(ctx.session.user.id, input.userIds)
      return { statuses }
    }),

  sendFriendRequest: mobileProtectedProcedure
    .input(SendFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.sendFriendRequest(ctx.session.user.id, input.userId)
      return { success: true }
    }),

  respondFriendRequest: mobileProtectedProcedure
    .input(RespondFriendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.respondFriendRequest(ctx.session.user.id, input.requestId, input.accept)
      return { success: true }
    }),

  getFriendRequests: mobileProtectedProcedure
    .input(GetFriendRequestsSchema)
    .query(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      return repo.getFriendRequests(ctx.session.user.id, input.direction, input.page, input.limit)
    }),

  getFriends: mobileProtectedProcedure.input(GetFriendsSchema).query(async ({ ctx, input }) => {
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

  getRelationshipStatus: mobilePublicProcedure
    .input(FollowUserSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        return { isFriend: false, pendingRequest: null }
      }
      const repo = new SocialRepository(ctx.prisma)
      return repo.getRelationshipStatus(ctx.session.user.id, input.userId)
    }),

  blockUser: mobileProtectedProcedure.input(BlockUserSchema).mutation(async ({ ctx, input }) => {
    const repo = new SocialRepository(ctx.prisma)
    await repo.blockUser(ctx.session.user.id, input.userId)
    return { success: true }
  }),

  unblockUser: mobileProtectedProcedure
    .input(UnblockUserSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      await repo.unblockUser(ctx.session.user.id, input.userId)
      return { success: true }
    }),

  getBlockedUsers: mobileProtectedProcedure
    .input(GetBlockedUsersSchema)
    .query(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      return repo.getBlockedUsers(ctx.session.user.id, input.page, input.limit, input.search)
    }),

  getActivityFeed: mobileProtectedProcedure
    .input(GetActivityFeedSchema)
    .query(async ({ ctx, input }) => {
      const repo = new SocialRepository(ctx.prisma)
      return repo.getActivityFeed(ctx.session.user.id, input.page, input.limit, {
        scope: input.scope,
        type: input.type,
      })
    }),
})
