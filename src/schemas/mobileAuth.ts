import { z } from 'zod'

export const ValidateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export const UpdateMobileProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  profileImageUrl: z.string().url().optional(),
})

export const DeleteMobileAccountSchema = z.object({
  confirmationText: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm' }),
  }),
})

export const MobileSessionSchema = z.object({
  // Optional device info for session tracking and analytics
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      platform: z.enum(['ios', 'android']),
      appVersion: z.string().optional(),
      osVersion: z.string().optional(),
    })
    .optional(),
})
