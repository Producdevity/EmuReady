import { z } from 'zod'
import { ListingType } from '@/schemas/common'
import { SortDirection } from '@/schemas/soc'

export const VoteTypeFilter = z.enum(['all', 'up', 'down'])
export const ListingTypeFilter = z.enum(['all', ...ListingType.options])
export const VoteSortField = z.enum(['createdAt', 'value', 'listingTitle'])

export const GetUserVotesSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  voteType: VoteTypeFilter.default('all'),
  listingType: ListingTypeFilter.default('all'),
  sortField: VoteSortField.default('createdAt'),
  sortDirection: SortDirection.default('desc'),
  includeNullified: z.boolean().default(false),
})

export const GetVotesOnAuthorListingsSchema = z.object({
  authorId: z.string().uuid(),
  voterId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export const GetVotePatternAnalysisSchema = z.object({
  userId: z.string().uuid(),
})

export const NullifyUserVotesSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  includeCommentVotes: z.boolean().default(true),
})

export const RestoreUserVotesSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

export type GetUserVotesInput = z.infer<typeof GetUserVotesSchema>
export type GetVotesOnAuthorListingsInput = z.infer<typeof GetVotesOnAuthorListingsSchema>
export type GetVotePatternAnalysisInput = z.infer<typeof GetVotePatternAnalysisSchema>
export type NullifyUserVotesInput = z.infer<typeof NullifyUserVotesSchema>
export type RestoreUserVotesInput = z.infer<typeof RestoreUserVotesSchema>
