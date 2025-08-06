import { ResourceError } from '@/lib/errors'
import { TRUST_LEVELS } from '@/lib/trust/config'
import { GetUserTrustInfoSchema } from '@/schemas/trust'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'

export const mobileTrustRouter = createMobileTRPCRouter({
  /**
   * Get current user's trust score and level
   */
  myInfo: mobileProtectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { trustScore: true },
    })

    if (!user) return ResourceError.user.notFound()

    // Determine trust level based on score
    const trustLevel = TRUST_LEVELS.slice()
      .reverse()
      .find((level) => user.trustScore >= level.minScore)

    return {
      trustScore: user.trustScore,
      trustLevel: trustLevel || TRUST_LEVELS[0],
    }
  }),

  /**
   * Get trust info for a specific user (public)
   */
  userInfo: mobilePublicProcedure
    .input(GetUserTrustInfoSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { trustScore: true, name: true },
      })

      if (!user) return ResourceError.user.notFound()

      // Determine trust level based on score
      const trustLevel = TRUST_LEVELS.slice()
        .reverse()
        .find((level) => user.trustScore >= level.minScore)

      return {
        trustScore: user.trustScore,
        trustLevel: trustLevel || TRUST_LEVELS[0],
        userName: user.name,
      }
    }),
})
