import { z } from 'zod'

export const MobileSignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const MobileSignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
})

export const MobileOAuthSignInSchema = z.object({
  provider: z.enum(['google', 'apple', 'github', 'discord']),
  redirectUrl: z.string().url().optional(),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const VerifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  clerkUserId: z.string().min(1, 'User ID is required'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const ResetPasswordSchema = z.object({
  code: z.string().length(6, 'Reset code must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

export const ChangeMobilePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const MobileSessionSchema = z.object({
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      platform: z.enum(['ios', 'android']),
      appVersion: z.string().optional(),
      osVersion: z.string().optional(),
    })
    .optional(),
})
