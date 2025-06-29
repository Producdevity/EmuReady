import { z } from 'zod'

export const GetGameByIdSchema = z.object({
  id: z.string().uuid(),
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

export const GetListingsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  gameId: z.string().uuid().optional(),
  systemId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const GetGamesSchema = z.object({
  search: z.string().optional(),
  systemId: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(20),
})

export const GetDevicesSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetEmulatorsSchema = z.object({
  systemId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetEmulatorByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetNotificationsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  unreadOnly: z.boolean().default(false),
})

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
})

export const SearchSuggestionsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).default(10),
})

export const GetUserVoteSchema = z.object({
  listingId: z.string().uuid(),
})

export const UpdateUserPreferencesSchema = z.object({
  defaultToUserDevices: z.boolean().optional(),
  defaultToUserSocs: z.boolean().optional(),
  notifyOnNewListings: z.boolean().optional(),
  bio: z.string().optional(),
})

export const AddDevicePreferenceSchema = z.object({
  deviceId: z.string().uuid(),
})

export const RemoveDevicePreferenceSchema = z.object({
  deviceId: z.string().uuid(),
})

export const BulkUpdateDevicePreferencesSchema = z.object({
  deviceIds: z.array(z.string().uuid()),
})

export const BulkUpdateSocPreferencesSchema = z.object({
  socIds: z.array(z.string().uuid()),
})

// New schemas for verified developers
export const IsVerifiedDeveloperSchema = z.object({
  userId: z.string().uuid(),
  emulatorId: z.string().uuid(),
})

// New schemas for listing verifications
export const VerifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().optional(),
})

export const RemoveVerificationSchema = z.object({
  verificationId: z.string().uuid(),
})

export const GetListingVerificationsSchema = z.object({
  listingId: z.string().uuid(),
})

export const GetMyVerificationsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
})
