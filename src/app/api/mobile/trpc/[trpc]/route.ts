import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest, NextResponse } from 'next/server'
import { getCORSHeaders } from '@/lib/cors'
import { createMobileTRPCFetchContext } from '@/server/api/mobileContext'
import { mobileRouter } from '@/server/api/routers/mobile'

// Get CORS headers with additional tRPC headers
function getTRPCCorsHeaders(request: NextRequest) {
  const baseHeaders = getCORSHeaders(request)
  return {
    ...baseHeaders,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-trpc-source, x-client-type',
    'Access-Control-Expose-Headers': 'x-trpc-source',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getTRPCCorsHeaders(request),
  })
}

const handler = async (req: NextRequest) => {
  const corsHeaders = getTRPCCorsHeaders(req)

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
              console.error(`❌ Mobile tRPC failed on ${path ?? '<no-path>'}: ${error.message}`)
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

    // Server-side error filtering - don't expose details in production
    const errorMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'An error occurred'

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
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
