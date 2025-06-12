import { z } from 'zod'

export const UpdateUserPreferencesSchema = z.object({
  defaultToUserDevices: z.boolean().optional(),
  notifyOnNewListings: z.boolean().optional(),
})

export const AddDevicePreferenceSchema = z.object({
  deviceId: z.string(),
})

export const RemoveDevicePreferenceSchema = z.object({
  deviceId: z.string(),
})

export const BulkUpdateDevicePreferencesSchema = z.object({
  deviceIds: z.array(z.string()),
})
