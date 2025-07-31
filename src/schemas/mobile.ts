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

export const FindSwitchTitleIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  maxResults: z.number().min(1).max(20).default(5),
})

export const GetBestSwitchTitleIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
})

export const GetSwitchGamesStatsMobileSchema = z.object({}).optional()

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

export const GetListingsSchema = z
  .object({
    page: z.number().min(1).default(1).describe('Page number for pagination'),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(20)
      .describe('Number of results per page (1-50)'),
    gameId: z.string().uuid().optional().describe('Filter by game ID'),
    systemId: z.string().uuid().optional().describe('Filter by system ID'),
    deviceId: z.string().uuid().optional().describe('Filter by device ID'),
    emulatorIds: z
      .array(z.string().uuid())
      .optional()
      .describe('Filter by emulator IDs'),
    search: z.string().optional().describe('Search listings by game name'),
  })
  .optional()
  .describe('Get listings with optional filters and pagination')

export const GetGamesSchema = z
  .object({
    search: z.string().optional(),
    systemId: z.string().uuid().optional(),
    limit: z.number().min(1).max(50).default(20),
  })
  .optional()

export const GetDevicesSchema = z
  .object({
    search: z.string().optional().describe('Search devices by name'),
    brandId: z.string().uuid().optional().describe('Filter by brand ID'),
    limit: z
      .number()
      .min(1)
      .max(1000)
      .default(50)
      .describe('Number of results to return (1-1000)'),
  })
  .optional()
  .describe('Get devices with optional filters')

export const GetEmulatorsSchema = z.object({
  systemId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetEmulatorByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetNotificationsSchema = z
  .object({
    page: z.number().min(1).default(1).describe('Page number for pagination'),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(20)
      .describe('Number of results per page (1-50)'),
    unreadOnly: z
      .boolean()
      .default(false)
      .describe('Show only unread notifications'),
  })
  .optional()
  .describe('Get notifications with optional filters and pagination')

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
  showNsfw: z.boolean().optional(),
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

// PC Listings schemas
export const CreatePcListingSchema = z.object({
  gameId: z.string().uuid(),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  memorySize: z.number().min(1).max(256),
  os: z.enum(['WINDOWS', 'LINUX', 'MACOS']),
  osVersion: z.string().min(1),
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

export const UpdatePcListingSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid().optional(),
  cpuId: z.string().uuid().optional(),
  gpuId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  performanceId: z.number().optional(),
  memorySize: z.number().min(1).max(256).optional(),
  os: z.enum(['WINDOWS', 'LINUX', 'MACOS']).optional(),
  osVersion: z.string().min(1).optional(),
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

export const GetPcListingsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  gameId: z.string().uuid().optional(),
  systemId: z.string().uuid().optional(),
  cpuId: z.string().uuid().optional(),
  gpuId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  os: z.enum(['WINDOWS', 'LINUX', 'MACOS']).optional(),
  search: z.string().optional(),
  minMemory: z.number().min(1).max(256).optional(),
  maxMemory: z.number().min(1).max(256).optional(),
})

export const GetCpusSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetGpusSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetPcPresetsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
})

export const CreatePcPresetSchema = z.object({
  name: z.string().min(1).max(50),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid(),
  memorySize: z.number().min(1).max(256),
  os: z.enum(['WINDOWS', 'LINUX', 'MACOS']),
  osVersion: z.string().min(1),
})

export const UpdatePcPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  cpuId: z.string().uuid().optional(),
  gpuId: z.string().uuid().optional(),
  memorySize: z.number().min(1).max(256).optional(),
  os: z.enum(['WINDOWS', 'LINUX', 'MACOS']).optional(),
  osVersion: z.string().min(1).optional(),
})

export const DeletePcPresetSchema = z.object({
  id: z.string().uuid(),
})
