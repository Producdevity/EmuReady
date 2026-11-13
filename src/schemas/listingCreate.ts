import { z } from 'zod'
import { JsonValueSchema } from '@/schemas/common'
import { PcOs } from '@orm'

const PerformanceScaleIdSchema = z.number().int().min(-2_147_483_648).max(2_147_483_647)

export const CreateListingBaseSchema = z.object({
  gameId: z.string().uuid(),
  deviceId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: PerformanceScaleIdSchema,
  notes: z.string().max(5000).nullable().optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: JsonValueSchema,
      }),
    )
    .nullable()
    .optional(),
})

export const CreatePcListingBaseSchema = z.object({
  gameId: z.string().uuid(),
  cpuId: z.string().uuid(),
  gpuId: z.string().uuid().optional(),
  emulatorId: z.string().uuid(),
  performanceId: PerformanceScaleIdSchema,
  memorySize: z.number().int().min(1).max(256),
  os: z.nativeEnum(PcOs),
  osVersion: z.string().min(1),
  notes: z.string().max(5000).optional(),
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: JsonValueSchema.optional(),
      }),
    )
    .optional(),
})
