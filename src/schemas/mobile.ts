import { z } from 'zod'
import { ReportReason, ReportStatus, PcOs, CustomFieldType, NotificationType } from '@orm'

// Type-safe custom field value schema using discriminated union
const CustomFieldValueSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(CustomFieldType.TEXT),
    customFieldDefinitionId: z.string().uuid(),
    value: z.string(),
  }),
  z.object({
    type: z.literal(CustomFieldType.TEXTAREA),
    customFieldDefinitionId: z.string().uuid(),
    value: z.string(),
  }),
  z.object({
    type: z.literal(CustomFieldType.URL),
    customFieldDefinitionId: z.string().uuid(),
    value: z.string().url(),
  }),
  z.object({
    type: z.literal(CustomFieldType.BOOLEAN),
    customFieldDefinitionId: z.string().uuid(),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal(CustomFieldType.SELECT),
    customFieldDefinitionId: z.string().uuid(),
    value: z.string(),
  }),
  z.object({
    type: z.literal(CustomFieldType.RANGE),
    customFieldDefinitionId: z.string().uuid(),
    value: z.number(),
  }),
])

// For backwards compatibility, also support simple format
const SimplifiedCustomFieldValueSchema = z.object({
  customFieldDefinitionId: z.string().uuid(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
})

export const GetGameByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetListingByIdSchema = z.object({
  id: z.string().uuid(),
})

export const GetListingEmulatorConfigSchema = z.object({
  listingId: z.string().uuid(),
  emulatorType: z.enum(['azahar', 'eden', 'gamenative']).optional(),
  packageName: z
    .enum([
      'dev.eden.eden_emulator',
      'dev.legacy.eden_emulator',
      'com.miHoYo.Yuanshen',
      'app.gamenative',
    ])
    .optional(),
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

export const FindThreeDsTitleIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  maxResults: z.number().min(1).max(20).default(5),
})

export const GetBestThreeDsTitleIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
})

export const GetThreeDsGamesStatsMobileSchema = z.object({}).optional()

export const FindSteamAppIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  maxResults: z.number().min(1).max(20).default(5),
})

export const GetBestSteamAppIdMobileSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
})

export const GetSteamGamesStatsMobileSchema = z.object({}).optional()

export const BatchBySteamAppIdsSchema = z.object({
  steamAppIds: z
    .array(z.string())
    .min(1, 'At least one Steam App ID is required')
    .max(1000, 'Maximum 1000 Steam App IDs per request')
    .describe('Steam App IDs to lookup (1-1000)'),
  emulatorName: z.string().optional().describe('Filter listings by emulator name'),
  maxListingsPerGame: z
    .number()
    .min(1)
    .max(50)
    .default(1)
    .describe('Maximum listings per game (1-50)'),
  showNsfw: z.boolean().default(false).describe('Include NSFW games'),
  minimal: z
    .boolean()
    .default(false)
    .describe('Return minimal response with only essential fields'),
})

export const GetListingCommentsSchema = z.object({
  listingId: z.string().uuid(),
})

export const CreateCommentSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
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
    .array(z.union([CustomFieldValueSchema, SimplifiedCustomFieldValueSchema]))
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
    .array(z.union([CustomFieldValueSchema, SimplifiedCustomFieldValueSchema]))
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

export const VoteCommentSchema = z.object({
  commentId: z.string().uuid(),
  value: z.union([z.boolean(), z.null()]), // true = upvote, false = downvote, null = remove vote
})

export const GetUserVotesSchema = z.object({
  commentIds: z.array(z.string().uuid()).min(1).max(100),
})

export const ReportCommentSchema = z.object({
  commentId: z.string().uuid(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().max(1000).optional(),
})

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
})

export const GetListingsSchema = z
  .object({
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1)
      .describe('Page number for pagination'),
    limit: z.number().min(1).max(50).default(20).describe('Number of results per page (1-50)'),
    gameIds: z.array(z.string().uuid()).optional().describe('Filter by game IDs'),
    systemIds: z.array(z.string().uuid()).optional().describe('Filter by system IDs'),
    deviceIds: z.array(z.string().uuid()).optional().describe('Filter by device IDs'),
    socIds: z.array(z.string().uuid()).optional().describe('Filter by SoC IDs'),
    emulatorIds: z.array(z.string().uuid()).optional().describe('Filter by emulator IDs'),
    performanceIds: z
      .array(z.union([z.number(), z.string().transform(Number)]))
      .optional()
      .describe('Filter by performance IDs'),
    search: z.string().optional().describe('Search listings by game name'),
  })
  .optional()
  .describe('Get listings with optional filters and pagination')

export type GetListingsInput = z.infer<typeof GetListingsSchema>

export const GetGamesSchema = z
  .object({
    search: z.string().optional(),
    systemId: z.string().uuid().optional(),
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1),
    limit: z.number().min(1).max(50).default(20),
  })
  .optional()

export type GetGamesInput = z.infer<typeof GetGamesSchema>

export const GetDevicesSchema = z
  .object({
    search: z.string().optional().describe('Search devices by name'),
    brandId: z.string().uuid().optional().describe('Filter by brand ID'),
    limit: z.number().min(1).max(1000).default(50).describe('Number of results to return (1-1000)'),
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
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1)
      .describe('Page number for pagination'),
    limit: z.number().min(1).max(50).default(20).describe('Number of results per page (1-50)'),
    unreadOnly: z.boolean().default(false).describe('Show only unread notifications'),
  })
  .optional()
  .describe('Get notifications with optional filters and pagination')

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
})

// Mobile notification preference schemas

export const UpdateNotificationPreferenceMobileSchema = z.object({
  type: z.nativeEnum(NotificationType),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
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
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
  notes: z.string().optional(),
  customFieldValues: z
    .array(z.union([CustomFieldValueSchema, SimplifiedCustomFieldValueSchema]))
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
  os: z.nativeEnum(PcOs).optional(),
  osVersion: z.string().min(1).optional(),
  notes: z.string().optional(),
  customFieldValues: z
    .array(z.union([CustomFieldValueSchema, SimplifiedCustomFieldValueSchema]))
    .optional(),
})

export const GetPcListingsSchema = z.object({
  page: z
    .number()
    .min(1)
    .default(1)
    .nullable()
    .transform((val) => val ?? 1),
  limit: z.number().min(1).max(50).default(20),
  gameId: z.string().uuid().optional(),
  systemId: z.string().uuid().optional(),
  cpuId: z.string().uuid().optional(),
  gpuId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  os: z.nativeEnum(PcOs).optional(),
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
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
})

export const UpdatePcPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  cpuId: z.string().uuid().optional(),
  gpuId: z.string().uuid().optional(),
  memorySize: z.number().min(1).max(256).optional(),
  os: z.nativeEnum(PcOs).optional(),
  osVersion: z.string().min(1).optional(),
})

export const DeletePcPresetSchema = z.object({
  id: z.string().uuid(),
})

// ===== Mobile Admin Schemas =====

export const MobileAdminGetStatsSchema = z.object({}).optional()

export const MobileAdminGetPendingListingsSchema = z
  .object({
    search: z.string().optional(),
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const MobileAdminApproveListingSchema = z.object({
  listingId: z.string().uuid(),
})

export const MobileAdminRejectListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().min(1).max(500).optional(),
})

export const MobileAdminGetPendingGamesSchema = z
  .object({
    search: z.string().optional(),
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const MobileAdminApproveGameSchema = z.object({
  gameId: z.string().uuid(),
})

export const MobileAdminRejectGameSchema = z.object({
  gameId: z.string().uuid(),
  notes: z.string().min(1).max(500).optional(),
})

export const MobileAdminGetReportsSchema = z
  .object({
    status: z.nativeEnum(ReportStatus).optional(),
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const MobileAdminUpdateReportStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.nativeEnum(ReportStatus),
  notes: z.string().min(1).max(500).optional(),
})

export const MobileAdminGetUserBansSchema = z
  .object({
    isActive: z.boolean().optional(),
    page: z
      .number()
      .min(1)
      .default(1)
      .nullable()
      .transform((val) => val ?? 1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const MobileAdminCreateUserBanSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  expiresAt: z.string().datetime().optional(),
})

export const MobileAdminUpdateUserBanSchema = z.object({
  banId: z.string().uuid(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
})

// ===== Catalog Integration Schemas (RetroCatalog) =====

export const GetDeviceCompatibilitySchema = z
  .object({
    deviceId: z.string().uuid().optional().describe('Device UUID to fetch compatibility data for'),
    deviceModelName: z.string().optional().describe('Device model name (e.g., "Pocket 5")'),
    deviceBrandName: z.string().optional().describe('Device brand name (e.g., "Retroid")'),
    systemIds: z
      .array(z.string().uuid())
      .optional()
      .describe('Filter results to specific system IDs'),
    includeEmulatorBreakdown: z
      .boolean()
      .default(true)
      .describe('Include per-emulator compatibility scores'),
    minListingCount: z
      .number()
      .min(0)
      .default(1)
      .describe('Minimum number of listings required to include a system'),
  })
  .refine((data) => data.deviceId || (data.deviceModelName && data.deviceBrandName), {
    message: 'Either deviceId or both deviceModelName and deviceBrandName must be provided',
  })
  .describe('Fetch device compatibility scores aggregated by system')

export type GetDeviceCompatibilityInput = z.infer<typeof GetDeviceCompatibilitySchema>

export const EmulatorCompatibilitySchema = z.object({
  id: z.string().uuid().describe('Emulator UUID'),
  name: z.string().describe('Emulator name'),
  key: z.string().describe('Emulator key identifier'),
  logoOption: z.string().nullable().describe('Emulator logo option'),
  listingCount: z.number().describe('Number of listings for this emulator'),
  avgCompatibilityScore: z.number().min(0).max(100).describe('Average compatibility score (0-100)'),
  avgPerformanceRank: z.number().describe('Average performance rank (1=best, 8=worst)'),
  avgSuccessRate: z.number().describe('Average success rate from community votes (0-1)'),
  developerVerifiedCount: z.number().describe('Count of developer-verified listings'),
})

export const SystemCompatibilitySchema = z.object({
  id: z.string().uuid().describe('System UUID'),
  name: z.string().describe('System name (e.g., "Nintendo Switch")'),
  key: z.string().describe('System key identifier (e.g., "nintendo_switch")'),
  compatibilityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall compatibility score for this system (0-100)'),
  confidence: z
    .enum(['low', 'medium', 'high'])
    .describe('Confidence level based on data quantity and quality'),
  metrics: z.object({
    totalListings: z.number().describe('Total number of approved listings'),
    uniqueGames: z.number().describe('Number of unique games tested'),
    avgPerformanceRank: z.number().describe('Average performance rank across all listings'),
    avgSuccessRate: z.number().describe('Average success rate from votes'),
    developerVerifiedCount: z.number().describe('Number of developer-verified listings'),
    totalVotes: z.number().describe('Total community votes'),
    authoredByDeveloperCount: z
      .number()
      .describe('Listings created by verified developers for this emulator'),
  }),
  emulators: z.array(EmulatorCompatibilitySchema).describe('Per-emulator compatibility breakdown'),
  lastUpdated: z.date().describe('Most recent listing timestamp'),
})

export const DeviceCompatibilityResponseSchema = z.object({
  device: z.object({
    id: z.string().uuid().describe('Device UUID'),
    modelName: z.string().describe('Device model name'),
    brandName: z.string().describe('Device brand name'),
    socName: z.string().nullable().describe('System-on-Chip name'),
  }),
  systems: z.array(SystemCompatibilitySchema).describe('System compatibility data'),
  generatedAt: z.date().describe('Timestamp when this data was generated'),
  cacheExpiresIn: z.number().describe('Seconds until cache expires'),
})

export type DeviceCompatibilityResponse = z.infer<typeof DeviceCompatibilityResponseSchema>
export type SystemCompatibility = z.infer<typeof SystemCompatibilitySchema>
export type EmulatorCompatibility = z.infer<typeof EmulatorCompatibilitySchema>
