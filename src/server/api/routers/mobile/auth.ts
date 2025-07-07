import { createClerkClient } from '@clerk/backend'
import { AppError } from '@/lib/errors'
import {
  ChangeMobilePasswordSchema,
  DeleteMobileAccountSchema,
  ForgotPasswordSchema,
  MobileOAuthSignInSchema,
  MobileSessionSchema,
  MobileSignInSchema,
  MobileSignUpSchema,
  RefreshTokenSchema,
  ResetPasswordSchema,
  UpdateMobileProfileSchema,
  ValidateTokenSchema,
  VerifyEmailSchema,
} from '@/schemas/mobileAuth'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
})

export const mobileAuthRouter = createMobileTRPCRouter({
  /**
   * Sign in with email and password
   */
  signIn: mobilePublicProcedure.input(MobileSignInSchema).mutation(async () => {
    return AppError.badRequest(
      'Sign-in should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
    )
  }),

  /**
   * Sign up with email and password
   */
  signUp: mobilePublicProcedure.input(MobileSignUpSchema).mutation(async () => {
    return AppError.badRequest(
      'Sign-up should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
    )
  }),

  /**
   * OAuth sign-in (Google, Apple, etc.)
   */
  oauthSignIn: mobilePublicProcedure
    .input(MobileOAuthSignInSchema)
    .mutation(async ({ input }) => {
      return AppError.badRequest(
        `${input.provider} authentication should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.`,
      )
    }),

  /**
   * Validate JWT token
   */
  validateToken: mobilePublicProcedure
    .input(ValidateTokenSchema)
    .query(async ({ input }) => {
      try {
        const { verifyToken } = await import('@clerk/backend')
        const payload = await verifyToken(input.token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        })

        return {
          valid: true,
          userId: payload.sub,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        }
      } catch {
        return {
          valid: false,
          userId: null,
          expiresAt: null,
        }
      }
    }),

  /**
   * Refresh token
   */
  refreshToken: mobilePublicProcedure
    .input(RefreshTokenSchema)
    .mutation(async () => {
      return AppError.badRequest(
        'Token refresh should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
      )
    }),

  /**
   * Verify email with code
   */
  verifyEmail: mobilePublicProcedure
    .input(VerifyEmailSchema)
    .mutation(async () => {
      return AppError.badRequest(
        'Email verification should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
      )
    }),

  /**
   * Forgot password
   */
  forgotPassword: mobilePublicProcedure
    .input(ForgotPasswordSchema)
    .mutation(async () => {
      return AppError.badRequest(
        'Password reset should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
      )
    }),

  /**
   * Reset password with code
   */
  resetPassword: mobilePublicProcedure
    .input(ResetPasswordSchema)
    .mutation(async () => {
      return AppError.badRequest(
        'Password reset should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
      )
    }),

  /**
   * Get current user session info
   */
  getSession: mobileProtectedProcedure
    .input(MobileSessionSchema.optional())
    .query(async ({ ctx }) => {
      const user = ctx.session.user

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        isAuthenticated: true,
      }
    }),

  /**
   * Sign out (invalidate session)
   */
  signOut: mobileProtectedProcedure.mutation(async () => {
    return { success: true, message: 'Signed out successfully' }
  }),

  /**
   * Update mobile profile
   */
  updateProfile: mobileProtectedProcedure
    .input(UpdateMobileProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { clerkId: true },
      })

      if (!user?.clerkId) {
        return AppError.notFound('User not found')
      }

      const updateData: Record<string, string> = {}
      if (input.firstName) updateData.firstName = input.firstName
      if (input.lastName) updateData.lastName = input.lastName
      if (input.profileImageUrl)
        updateData.profileImageUrl = input.profileImageUrl

      if (Object.keys(updateData).length > 0) {
        await clerkClient.users.updateUser(user.clerkId, updateData)
      }

      return await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      })
    }),

  /**
   * Change password
   */
  changePassword: mobileProtectedProcedure
    .input(ChangeMobilePasswordSchema)
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { clerkId: true },
      })

      if (!user?.clerkId) {
        return AppError.notFound('User not found')
      }

      return AppError.badRequest(
        'Password change should be handled by the mobile app using Clerk SDK. This endpoint is for reference only.',
      )
    }),

  /**
   * Delete account
   */
  deleteAccount: mobileProtectedProcedure
    .input(DeleteMobileAccountSchema)
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { clerkId: true },
      })

      if (!user?.clerkId) {
        return AppError.notFound('User not found')
      }

      await clerkClient.users.deleteUser(user.clerkId)

      return { success: true, message: 'Account deleted successfully' }
    }),
})
