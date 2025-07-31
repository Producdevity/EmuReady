import { z } from 'zod'

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const VerifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  clerkUserId: z.string().min(1, 'User ID is required'),
})
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
  // TODO: figure out if we need this
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      platform: z.enum(['ios', 'android']),
      appVersion: z.string().optional(),
      osVersion: z.string().optional(),
    })
    .optional(),
})
