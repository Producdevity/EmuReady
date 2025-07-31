import { z } from 'zod'
import { CreateListingSchema } from '@/schemas/listing'

const listingFormSchema = CreateListingSchema.extend({
  gameId: z.string().min(1, 'Game is required'),
  deviceId: z.string().min(1, 'Device is required'),
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce
    .number({
      required_error: 'Performance rating is required',
      invalid_type_error: 'Performance rating is required',
    })
    .min(1, 'Performance rating is required'),
})

export default listingFormSchema
