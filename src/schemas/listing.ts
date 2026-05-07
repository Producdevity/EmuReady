import { z } from 'zod'
import { PAGINATION } from '@/data/constants'
import { ListingType } from '@/schemas/common'
import {
  BaseCreateListingFields,
  BaseGetListingsFields,
  BaseUpdateListingAdminFields,
  BaseUpdateListingUserFields,
} from '@/schemas/listingBase'
import { ApprovalStatus } from '@orm'

export const CreateListingSchema = z.object({
  ...BaseCreateListingFields,
  deviceId: z.string().uuid(),
})

export const GetListingsSchema = z.object({
  ...BaseGetListingsFields,
  deviceIds: z.array(z.string().uuid()).nullable().optional(),
  socIds: z.array(z.string().uuid()).nullable().optional(),
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
    .nullable()
    .optional(),
})

export const GetListingByIdSchema = z.object({ id: z.string().uuid() })

export const GetListingModeratorInfoSchema = z.object({
  id: z.string().uuid(),
  type: ListingType,
})

export const GetPendingListingsSchema = z
  .object({
    search: z.string().nullable().optional(),
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
      .nullable()
      .optional(),
    sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  })
  .optional()

export const DeleteListingSchema = z.object({ id: z.string().uuid() })

export const GetProcessedSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  filterStatus: z.nativeEnum(ApprovalStatus).nullable().optional(),
  search: z.string().nullable().optional(),
  sortField: z
    .enum([
      'processedAt',
      'createdAt',
      'status',
      'game.title',
      'game.system.name',
      'device',
      'emulator.name',
      'author.name',
    ])
    .nullable()
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
})

export const OverrideApprovalStatusSchema = z.object({
  listingId: z.string().uuid(),
  newStatus: z.nativeEnum(ApprovalStatus), // PENDING, APPROVED, or REJECTED
  overrideNotes: z.string().nullable().optional(),
})

export const CreateVoteSchema = z.object({
  listingId: z.string().uuid(),
  value: z.boolean(),
  recaptchaToken: z.string().nullable().optional(), // reCAPTCHA token for bot protection
})

export const CreateVoteComment = z.object({
  commentId: z.string().uuid(),
  value: z.boolean(), // true = upvote, false = downvote
})
export const CreateCommentSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().nullable().optional(),
  recaptchaToken: z.string().nullable().optional(), // reCAPTCHA token for bot protection
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

export const PinCommentSchema = z.object({
  listingId: z.string().uuid(),
  commentId: z.string().uuid(),
  replaceExisting: z.boolean().default(false),
})

export const UnpinCommentSchema = z.object({
  listingId: z.string().uuid(),
})

export const ResetListingToPendingSchema = z.object({ listingId: z.string().uuid() })

export const ApproveListingSchema = z.object({ listingId: z.string().uuid() })
export const RejectListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().nullable().optional(),
})

export const BulkApproveListingsSchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1, 'At least one listing must be selected'),
})

export const BulkRejectListingsSchema = z.object({
  listingIds: z.array(z.string().uuid()).min(1, 'At least one listing must be selected'),
  notes: z.string().nullable().optional(),
})

export const VerifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().nullable().optional(),
})

export const UnverifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().nullable().optional(),
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
    .nullable()
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  search: z.string().min(1).nullable().optional(),
  statusFilter: z.nativeEnum(ApprovalStatus).nullable().optional(),
  systemFilter: z.string().uuid().nullable().optional(),
  emulatorFilter: z.string().uuid().nullable().optional(),
})

export const GetListingForEditSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateListingAdminSchema = z.object({
  ...BaseUpdateListingAdminFields,
  deviceId: z.string().uuid(),
})

export const UpdateListingUserSchema = z.object({
  ...BaseUpdateListingUserFields,
})

export const GetListingForUserEditSchema = z.object({
  id: z.string().uuid(),
})
