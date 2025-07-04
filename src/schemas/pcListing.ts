import { z } from 'zod'
import { ApprovalStatus, PcOs } from '@orm'

export const CreatePcListingSchema = z.object({
  gameId: z.string().uuid(),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid().optional(), // Optional for integrated graphics
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  memorySize: z.number().int().positive().min(1).max(256), // 1GB to 256GB
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
  notes: z.string().optional(),
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

export const GetPcListingsSchema = z.object({
  systemIds: z.array(z.string().uuid()).optional(),
  cpuIds: z.array(z.string().uuid()).optional(),
  gpuIds: z.array(z.string().uuid()).optional(),
  emulatorIds: z.array(z.string().uuid()).optional(),
  performanceIds: z.array(z.number()).optional(),
  osFilter: z.array(z.nativeEnum(PcOs)).optional(),
  memoryMin: z.number().int().positive().optional(),
  memoryMax: z.number().int().positive().optional(),
  searchTerm: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sortField: z
    .enum([
      'game.title',
      'game.system.name',
      'cpu',
      'gpu',
      'emulator.name',
      'performance.rank',
      'successRate',
      'author.name',
      'createdAt',
      'memorySize',
    ])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
  myListings: z.boolean().optional(),
})

export const GetPcListingByIdSchema = z.object({ id: z.string().uuid() })

export const GetPendingPcListingsSchema = z
  .object({
    search: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().default(20),
    sortField: z
      .enum([
        'game.title',
        'game.system.name',
        'cpu',
        'gpu',
        'emulator.name',
        'author.name',
        'createdAt',
      ])
      .optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  })
  .optional()

export const DeletePcListingSchema = z.object({ id: z.string().uuid() })

export const GetProcessedPcSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  filterStatus: z.nativeEnum(ApprovalStatus).optional(),
  search: z.string().optional(),
})

export const OverridePcApprovalStatusSchema = z.object({
  pcListingId: z.string().uuid(),
  newStatus: z.nativeEnum(ApprovalStatus), // PENDING, APPROVED, or REJECTED
  overrideNotes: z.string().optional(),
})

export const ApprovePcListingSchema = z.object({
  pcListingId: z.string().uuid(),
})
export const RejectPcListingSchema = z.object({
  pcListingId: z.string().uuid(),
  notes: z.string().optional(),
})

export const BulkApprovePcListingsSchema = z.object({
  pcListingIds: z
    .array(z.string().uuid())
    .min(1, 'At least one PC listing must be selected'),
})

export const BulkRejectPcListingsSchema = z.object({
  pcListingIds: z
    .array(z.string().uuid())
    .min(1, 'At least one PC listing must be selected'),
  notes: z.string().optional(),
})

export const VerifyPcListingSchema = z.object({
  pcListingId: z.string().uuid(),
  notes: z.string().optional(),
})

export const UnverifyPcListingSchema = z.object({
  pcListingId: z.string().uuid(),
  notes: z.string().optional(),
})

// Admin schemas for PC listing management
export const GetAllPcListingsAdminSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortField: z
    .enum([
      'game.title',
      'game.system.name',
      'cpu',
      'gpu',
      'emulator.name',
      'performance.rank',
      'author.name',
      'createdAt',
      'status',
      'memorySize',
    ])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  search: z.string().min(1).optional(),
  statusFilter: z.nativeEnum(ApprovalStatus).optional(),
  systemFilter: z.string().uuid().optional(),
  emulatorFilter: z.string().uuid().optional(),
  osFilter: z.nativeEnum(PcOs).optional(),
})

export const GetPcListingForEditSchema = z.object({
  id: z.string().uuid(),
})

export const UpdatePcListingAdminSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid().optional(), // Optional for integrated graphics
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  memorySize: z.number().int().positive().min(1).max(256),
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
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

export const UpdatePcListingUserSchema = z.object({
  id: z.string().uuid(),
  performanceId: z.number(),
  memorySize: z.number().int().positive().min(1).max(256),
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
  notes: z.string().nullable().optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional(),
})

export const GetPcListingForUserEditSchema = z.object({
  id: z.string().uuid(),
})

// PC Preset schemas
export const CreatePcPresetSchema = z.object({
  name: z.string().min(1).max(50),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid().optional(), // Optional for integrated graphics
  memorySize: z.number().int().positive().min(1).max(256),
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
})

export const UpdatePcPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid().optional(), // Optional for integrated graphics
  memorySize: z.number().int().positive().min(1).max(256),
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
})

export const DeletePcPresetSchema = z.object({ id: z.string().uuid() })

export const GetPcPresetsSchema = z.object({
  userId: z.string().uuid().optional(), // For admin access
})
