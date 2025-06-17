import { auth } from '@clerk/nextjs/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest, NextResponse } from 'next/server'
import { appRouter } from '@/server/api/root'
import { prisma } from '@/server/db'

// CORS headers for mobile API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-trpc-source, x-client-type',
  'Access-Control-Expose-Headers': 'x-trpc-source',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

const handler = async (req: NextRequest) => {
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/mobile/trpc',
      req,
      router: appRouter,
      createContext: async () => {
        let session = null

        try {
          const { userId } = await auth()

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
        } catch (authError) {
          // Log auth error but don't fail the request
          // Many mobile endpoints are public anyway
          console.warn('Auth error in mobile tRPC:', authError)
        }

        return {
          session,
          prisma,
          headers: new Headers(req.headers),
        }
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
          headers: corsHeaders,
        }
      },
    })

    // Ensure CORS headers are set on the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    // If anything fails, return an error response with CORS headers
    console.error('Mobile tRPC handler error:', error)

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'An error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    )
  }
}

export { handler as GET, handler as POST }
