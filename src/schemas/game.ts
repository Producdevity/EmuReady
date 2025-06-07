import { ApprovalStatus } from '@orm'
import { z } from 'zod'

export const GameSortField = z.enum([
  'title',
  'system.name',
  'listingsCount',
  'submittedAt',
  'status',
])

export const SortDirection = z.enum(['asc', 'desc'])

export const GameApprovalStatusSchema = z.enum([
  ApprovalStatus.PENDING,
  ApprovalStatus.APPROVED,
  ApprovalStatus.REJECTED,
])

export const GetGamesSchema = z
  .object({
    systemId: z.string().uuid().optional(),
    search: z.string().optional(),
    status: GameApprovalStatusSchema.optional(),
    submittedBy: z.string().uuid().optional(),
    limit: z.number().default(100),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GameSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetGameByIdSchema = z.object({ id: z.string().uuid() })

export const CreateGameSchema = z.object({
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
})

export const UpdateGameSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
})

export const DeleteGameSchema = z.object({ id: z.string().uuid() })

export const ApproveGameSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
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

export const GameStatsSchema = z.object({
  pendingCount: z.number(),
  approvedCount: z.number(),
  rejectedCount: z.number(),
})
