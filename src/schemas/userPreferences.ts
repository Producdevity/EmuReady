import { z } from 'zod'

export const UpdateUserPreferencesSchema = z.object({
  defaultToUserDevices: z.boolean().optional(),
  defaultToUserSocs: z.boolean().optional(),
  notifyOnNewListings: z.boolean().optional(),
  showNsfw: z.boolean().optional(),
  bio: z.string().max(500).optional(), // Bio field with XSS protection handled in server
  // Privacy preferences
  profilePublic: z.boolean().optional(),
  showActivityInFeed: z.boolean().optional(),
  showVotingActivity: z.boolean().optional(),
  allowFollows: z.boolean().optional(),
  allowFriendRequests: z.boolean().optional(),
  followersVisible: z.boolean().optional(),
  followingVisible: z.boolean().optional(),
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

export const AddSocPreferenceSchema = z.object({
  socId: z.string().uuid(),
})

export const RemoveSocPreferenceSchema = z.object({
  socId: z.string().uuid(),
})

export const BulkUpdateSocPreferencesSchema = z.object({
  socIds: z.array(z.string().uuid()),
})
