import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/server/auth'
import { createInnerTRPCContext, type TRPCContext } from '@/server/api/trpc'

const handler = async (req: NextRequest) => {
  const session = await getServerSession(authOptions)

  const ctx: TRPCContext = createInnerTRPCContext({ session })

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ctx,
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
