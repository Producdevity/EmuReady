import { z } from 'zod'
import { PAGINATION } from '@/data/constants'

export const FollowUserSchema = z.object({
  userId: z.string().uuid(),
})

export const UnfollowUserSchema = z.object({
  userId: z.string().uuid(),
})

export const RemoveFollowerSchema = z.object({
  userId: z.string().uuid(),
})

export const GetFollowersSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
})

export const GetFollowingSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
})

export const SendFriendRequestSchema = z.object({
  userId: z.string().uuid(),
})

export const RespondFriendRequestSchema = z.object({
  requestId: z.string().uuid(),
  accept: z.boolean(),
})

export const GetFriendRequestsSchema = z.object({
  direction: z.enum(['sent', 'received']),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
})

export const GetFriendsSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
})

export const BlockUserSchema = z.object({
  userId: z.string().uuid(),
})

export const UnblockUserSchema = z.object({
  userId: z.string().uuid(),
})

export const GetActivityFeedSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  scope: z.enum(['following', 'community']).default('following'),
  type: z.enum(['all', 'listing', 'pcListing']).default('all'),
})

export const GetBulkFollowStatusesSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(50),
})

export const GetBlockedUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
})
