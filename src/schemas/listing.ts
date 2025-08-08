import { z } from 'zod'
import { PAGINATION } from '@/data/constants'
import { ApprovalStatus } from '@orm'

export const CreateListingSchema = z.object({
  gameId: z.string().uuid(),
  deviceId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  notes: z.string().max(5000).optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(), // Zod .any() for Prisma.JsonValue; validation happens implicitly by structure
      }),
    )
    .optional(),
  recaptchaToken: z.string().optional(), // reCAPTCHA token for bot protection
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
      'performance.rank',
      'successRate',
      'author.name',
      'createdAt',
    ])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
  myListings: z.boolean().optional(),
})

export const GetListingByIdSchema = z.object({ id: z.string().uuid() })

export const GetPendingListingsSchema = z
  .object({
    search: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().default(PAGINATION.DEFAULT_LIMIT),
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
  recaptchaToken: z.string().optional(), // reCAPTCHA token for bot protection
})

export const CreateVoteComment = z.object({
  commentId: z.string().uuid(),
  value: z.boolean(), // true = upvote, false = downvote
})
export const CreateCommentSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
  recaptchaToken: z.string().optional(), // reCAPTCHA token for bot protection
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

export const BulkApproveListingsSchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1, 'At least one listing must be selected'),
})

export const BulkRejectListingsSchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1, 'At least one listing must be selected'),
  notes: z.string().optional(),
})

export const VerifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().optional(),
})

export const UnverifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().optional(),
})

// Admin schemas for listing management
export const GetAllListingsAdminSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sortField: z
    .enum([
      'game.title',
      'game.system.name',
      'device',
      'emulator.name',
      'performance.rank',
      'author.name',
      'createdAt',
      'status',
    ])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  search: z.string().min(1).optional(),
  statusFilter: z.nativeEnum(ApprovalStatus).optional(),
  systemFilter: z.string().uuid().optional(),
  emulatorFilter: z.string().uuid().optional(),
})

export const GetListingForEditSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateListingAdminSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  deviceId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  notes: z.string().optional(),
  status: z.nativeEnum(ApprovalStatus),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional(),
})

export const UpdateListingUserSchema = z.object({
  id: z.string().uuid(),
  performanceId: z.number(),
  notes: z.string().max(5000).nullable().optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional(),
})

export const GetListingForUserEditSchema = z.object({
  id: z.string().uuid(),
})
