import { z } from 'zod'
import { PAGINATION } from '@/data/constants'

export const FollowGameSchema = z.object({
  gameId: z.string().uuid(),
})

export const UnfollowGameSchema = z.object({
  gameId: z.string().uuid(),
})

export const IsFollowingGameSchema = z.object({
  gameId: z.string().uuid(),
})

export const GetBulkGameFollowStatusesSchema = z.object({
  gameIds: z.array(z.string().uuid()).min(1).max(50),
})

export const GetFollowedGamesSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().max(100).optional(),
  systemId: z.string().uuid().optional(),
})

export const GetGameFollowCountsSchema = z.object({
  userId: z.string().uuid(),
})
