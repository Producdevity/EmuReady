import { auth, clerkClient } from '@clerk/nextjs/server'
import { ResourceError } from '@/lib/errors'
import { RevokeSessionSchema } from '@/schemas/account'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const accountRouter = createTRPCRouter({
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { clerkId: true },
    })

    if (!user?.clerkId) return ResourceError.user.notFound()

    const { sessionId: currentSessionId } = await auth()

    const clerk = await clerkClient()
    const sessions = await clerk.sessions.getSessionList({
      userId: user.clerkId,
      status: 'active',
    })

    return {
      currentSessionId,
      sessions: sessions.data.map((session) => ({
        id: session.id,
        status: session.status,
        lastActiveAt: session.lastActiveAt,
        createdAt: session.createdAt,
        expireAt: session.expireAt,
        latestActivity: session.latestActivity,
      })),
    }
  }),

  revokeSession: protectedProcedure.input(RevokeSessionSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { clerkId: true },
    })

    if (!user?.clerkId) return ResourceError.user.notFound()

    const clerk = await clerkClient()

    // Verify the session belongs to this user
    const sessions = await clerk.sessions.getSessionList({
      userId: user.clerkId,
    })

    const sessionBelongsToUser = sessions.data.some((s) => s.id === input.sessionId)
    if (!sessionBelongsToUser) {
      return ResourceError.account.sessionNotFound()
    }

    await clerk.sessions.revokeSession(input.sessionId)
    return { success: true }
  }),
})
