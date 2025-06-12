import { z } from 'zod'

export const UpdateUserPreferencesSchema = z.object({
  defaultToUserDevices: z.boolean().optional(),
  defaultToUserSocs: z.boolean().optional(),
  notifyOnNewListings: z.boolean().optional(),
  bio: z.string().max(500).optional(), // Bio field with XSS protection handled in server
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

export const AddSocPreferenceSchema = z.object({
  socId: z.string(),
})

export const RemoveSocPreferenceSchema = z.object({
  socId: z.string(),
})

export const BulkUpdateSocPreferencesSchema = z.object({
  socIds: z.array(z.string()),
})
