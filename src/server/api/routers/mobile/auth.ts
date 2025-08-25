import { createClerkClient } from '@clerk/backend'
import { ResourceError } from '@/lib/errors'
import {
  DeleteMobileAccountSchema,
  MobileSessionSchema,
  UpdateMobileProfileSchema,
  ValidateTokenSchema,
} from '@/schemas/mobileAuth'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import getErrorMessage from '@/utils/getErrorMessage'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
})

export const mobileAuthRouter = createMobileTRPCRouter({
  /**
   * Validate JWT token
   */
  validateToken: mobilePublicProcedure.input(ValidateTokenSchema).query(async ({ input }) => {
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
    } catch (error) {
      // Log validation failures for security monitoring
      console.error('[Security] Token validation failed:', {
        timestamp: new Date().toISOString(),
        error: getErrorMessage(error),
        tokenLength: input.token?.length,
      })

      return {
        valid: false,
        userId: null,
        expiresAt: null,
      }
    }
  }),
  /**
   * Get current user session info
   */
  getSession: mobileProtectedProcedure
    .input(MobileSessionSchema.optional())
    .query(async ({ ctx }) => {
      const user = ctx.session.user

      // Fetch additional user data including trust score
      const userData = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          trustScore: true,
          profileImage: true,
        },
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          trustScore: userData?.trustScore ?? 0,
          profileImage: userData?.profileImage ?? null,
        },
        isAuthenticated: true,
      }
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

      if (!user?.clerkId) return ResourceError.user.notFound()

      const updateData: Record<string, string> = {}
      if (input.firstName) updateData.firstName = input.firstName
      if (input.lastName) updateData.lastName = input.lastName
      if (input.profileImageUrl) updateData.profileImageUrl = input.profileImageUrl

      if (Object.keys(updateData).length > 0) {
        await clerkClient.users.updateUser(user.clerkId, updateData)
      }

      return await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      })
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

      if (!user?.clerkId) return ResourceError.user.notFound()

      await clerkClient.users.deleteUser(user.clerkId)

      return { success: true, message: 'Account deleted successfully' }
    }),
})
