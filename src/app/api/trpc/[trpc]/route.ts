import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { appRouter } from '@/server/api/root'
import { createInnerTRPCContext } from '@/server/api/trpc'
import { prisma } from '@/server/db'

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const { userId } = await auth()

      let session = null

      if (userId) {
        // Fetch user data from database using clerkId
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        })

        if (user) {
          session = {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          }
        }
      }

      return createInnerTRPCContext({ session })
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
  })
}

export { handler as GET, handler as POST }
