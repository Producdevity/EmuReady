import { ApprovalStatus } from '@orm'
import { z } from 'zod'

export const CreateListingSchema = z.object({
  gameId: z.string().uuid(),
  deviceId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  notes: z.string().optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(), // Zod .any() for Prisma.JsonValue; validation happens implicitly by structure
      }),
    )
    .optional(),
})

export const GetListingsSchema = z.object({
  systemIds: z.array(z.string().uuid()).optional(),
  deviceIds: z.array(z.string().uuid()).optional(),
  socIds: z.array(z.string().uuid()).optional(),
  emulatorIds: z.array(z.string().uuid()).optional(),
  performanceIds: z.array(z.number()).optional(),
  searchTerm: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sortField: z
    .enum([
      'game.title',
      'game.system.name',
      'device',
      'emulator.name',
      'performance.label',
      'successRate',
      'author.name',
      'createdAt',
    ])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
})

export const GetListingByIdSchema = z.object({ id: z.string().uuid() })

export const GetPendingListingsSchema = z
  .object({
    search: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().default(20),
    sortField: z
      .enum([
        'game.title',
        'game.system.name',
        'device',
        'emulator.name',
        'author.name',
        'createdAt',
      ])
      .optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  })
  .optional()

export const DeleteListingSchema = z.object({ id: z.string().uuid() })

export const GetProcessedSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  filterStatus: z.nativeEnum(ApprovalStatus).optional(),
  search: z.string().optional(),
})

export const OverrideApprovalStatusSchema = z.object({
  listingId: z.string().uuid(),
  newStatus: z.nativeEnum(ApprovalStatus), // PENDING, APPROVED, or REJECTED
  overrideNotes: z.string().optional(),
})

export const CreateVoteSchema = z.object({
  listingId: z.string().uuid(),
  value: z.boolean(),
})

export const CreateVoteComment = z.object({
  commentId: z.string().uuid(),
  value: z.boolean(), // true = upvote, false = downvote
})
export const CreateCommentSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
})

export const EditCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

export const GetSortedCommentsSchema = z.object({
  listingId: z.string().uuid(),
  sortBy: z.enum(['newest', 'oldest', 'popular']).default('newest'),
})

export const GetCommentsSchema = z.object({ listingId: z.string().uuid() })

export const DeleteCommentSchema = z.object({ commentId: z.string().uuid() })

export const ApproveListingSchema = z.object({ listingId: z.string().uuid() })
export const RejectListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().optional(),
})
