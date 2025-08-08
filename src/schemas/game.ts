import { z } from 'zod'
import { ApprovalStatus } from '@orm'

export const GameSortField = z.enum([
  'title',
  'system.name',
  'listingsCount',
  'submittedAt',
  'status',
])

export const SortDirection = z.enum(['asc', 'desc'])

export const GameListingFilter = z.enum(['all', 'withListings', 'noListings'])

export const GameApprovalStatusSchema = z.enum([
  ApprovalStatus.PENDING,
  ApprovalStatus.APPROVED,
  ApprovalStatus.REJECTED,
])

export const GetGamesSchema = z
  .object({
    systemId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    search: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    status: GameApprovalStatusSchema.optional(),
    submittedBy: z.string().uuid().optional(),
    hideGamesWithNoListings: z.boolean().optional().default(false), // Keep for backward compatibility
    listingFilter: GameListingFilter.optional().default('withListings'),
    limit: z.number().default(100),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GameSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()
  .transform((data) => {
    if (!data) return data

    // Clean up any "undefined" strings that might come from URL parameters
    return {
      ...data,
      systemId: data.systemId === 'undefined' ? undefined : data.systemId,
      search: data.search === 'undefined' ? undefined : data.search,
    }
  })

export const GetGameByIdSchema = z.object({ id: z.string().uuid() })

export const CheckExistingByTgdbIdsSchema = z.object({
  tgdbGameIds: z.array(z.number()),
})

export const CreateGameSchema = z.object({
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
  boxartUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  tgdbGameId: z.number().optional(),
  isErotic: z.boolean().optional(),
})

export const UpdateGameSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
  boxartUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  tgdbGameId: z.number().optional(),
  isErotic: z.boolean().optional(),
})

export const DeleteGameSchema = z.object({ id: z.string().uuid() })

export const OverrideGameStatusSchema = z.object({
  gameId: z.string().uuid(),
  newStatus: z.nativeEnum(ApprovalStatus),
  overrideNotes: z.string().optional(),
})

export const ApproveGameSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  notes: z.string().optional(),
})

export const BulkApproveGamesSchema = z.object({
  gameIds: z.array(z.string().uuid()).min(1, 'At least one game must be selected'),
})

export const BulkRejectGamesSchema = z.object({
  gameIds: z.array(z.string().uuid()).min(1, 'At least one game must be selected'),
  notes: z.string().optional(),
})

export const GetPendingGamesSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().default(50),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GameSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

// Nintendo Switch Title ID lookup schemas
export const FindSwitchTitleIdSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  maxResults: z.number().min(1).max(20).default(5),
})

export const GetBestSwitchTitleIdSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
})

export const GetSwitchGamesStatsSchema = z.object({}).optional()
