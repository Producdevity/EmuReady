import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { connection, type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { createAppRouterTRPCContext } from '@/server/api/trpc'

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createAppRouterTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`)
          }
        : undefined,
  })
}

async function GET(req: NextRequest) {
  await connection()
  return handler(req)
}

export { GET, handler as POST }
