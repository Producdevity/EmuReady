import { z } from 'zod'
import { CreateListingSchema } from '@/schemas/listing'

const listingFormSchema = CreateListingSchema.extend({
  gameId: z.string().min(1, 'Game is required'),
  deviceId: z.string().min(1, 'Device is required'),
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce.number().min(1, 'Performance rating is required'),
})

export default listingFormSchema
