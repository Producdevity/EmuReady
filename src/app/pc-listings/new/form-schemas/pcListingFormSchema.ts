import { z } from 'zod'
import { CreatePcListingSchema } from '@/schemas/pcListing'

const pcListingFormSchema = CreatePcListingSchema.extend({
  gameId: z.string().min(1, 'Game is required'),
  cpuId: z.string().min(1, 'CPU is required'),
  gpuId: z.string().optional(), // GPU is optional for integrated graphics
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce
    .number({
      required_error: 'Performance rating is required',
      invalid_type_error: 'Performance rating is required',
    })
    .min(1, 'Performance rating is required'),
  memorySize: z.coerce
    .number()
    .min(1, 'Memory size is required')
    .max(256, 'Memory size cannot exceed 256 GB'),
  osVersion: z.string().min(1, 'OS version is required'),
})

export default pcListingFormSchema
