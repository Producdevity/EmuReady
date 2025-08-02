import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest, NextResponse } from 'next/server'
import { createMobileTRPCFetchContext } from '@/server/api/mobileContext'
import { mobileRouter } from '@/server/api/routers/mobile'

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
    // Create a new request with properly decoded URL to prevent double encoding issues
    const url = new URL(req.url)
    const decodedPathname = decodeURIComponent(url.pathname)
    const correctedUrl = new URL(decodedPathname + url.search, url.origin)

    const correctedRequest = new Request(correctedUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })

    const response = await fetchRequestHandler({
      endpoint: '/api/mobile/trpc',
      req: correctedRequest,
      router: mobileRouter,
      createContext: createMobileTRPCFetchContext,
      onError:
        process.env.NODE_ENV === 'development'
          ? ({ path, error }: { path?: string; error: Error }) => {
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
