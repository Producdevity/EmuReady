import { auth } from '@clerk/nextjs/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { prisma } from '@/server/db'

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/mobile/trpc',
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

      return { session, prisma }
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ Mobile tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
    responseMeta() {
      return {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, x-trpc-source',
          'Access-Control-Expose-Headers': 'x-trpc-source',
        },
      }
    },
  })
}

export { handler as GET, handler as POST, handler as OPTIONS }
