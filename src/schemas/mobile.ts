import { z } from 'zod'

export const GetGameByIdSchema = z.object({
  gameId: z.string().uuid(),
})

export const GetListingByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetListingsByGameSchema = z.object({
  gameId: z.string().uuid(),
})

export const SearchGamesSchema = z.object({
  query: z.string().min(1),
})

export const GetListingCommentsSchema = z.object({
  listingId: z.string().uuid(),
})

export const CreateCommentSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1),
})

export const VoteListingSchema = z.object({
  listingId: z.string().uuid(),
  value: z.boolean(),
})

export const GetUserProfileSchema = z.object({
  userId: z.string().uuid(),
})

export const GetUserListingsSchema = z.object({
  userId: z.string().uuid(),
})

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
        value: z.any(),
      }),
    )
    .optional(),
})

export const UpdateListingSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  performanceId: z.number().optional(),
  notes: z.string().optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional(),
})

export const DeleteListingSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1),
})

export const DeleteCommentSchema = z.object({
  commentId: z.string().uuid(),
})

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
})
