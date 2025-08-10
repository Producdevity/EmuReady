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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
    'Access-Control-Expose-Headers': 'Content-Type',
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

  // Debug: Log ALL headers to see what's actually arriving
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value.substring(0, 50) // Truncate for security
  })

  console.log('[Mobile Route] Handling request to:', req.url)
  console.log('[Mobile Route] ALL headers received:', JSON.stringify(headers))

  // Check for Vercel's special header that might contain the stripped auth
  const vercelScHeaders = req.headers.get('x-vercel-sc-headers')
  if (vercelScHeaders) {
    console.log('[Mobile Route] Found x-vercel-sc-headers:', vercelScHeaders.substring(0, 200))
  }

  // Check for authorization header in different cases and custom headers
  const authCheck = {
    authorization: !!req.headers.get('authorization'),
    Authorization: !!req.headers.get('Authorization'),
    xAuthToken: !!req.headers.get('x-auth-token'),
  }
  console.log('[Mobile Route] Auth header check:', authCheck)

  try {
    // Create a new request with properly decoded URL to prevent double encoding issues
    const url = new URL(req.url)
    const decodedPathname = decodeURIComponent(url.pathname)
    const correctedUrl = new URL(decodedPathname + url.search, url.origin)

    // Debug: Check if headers are preserved when creating new Request
    console.log(
      '[Mobile Route] Before new Request - auth header:',
      req.headers.get('authorization'),
    )
    console.log(
      '[Mobile Route] Before new Request - x-auth-token:',
      req.headers.get('x-auth-token'),
    )

    const correctedRequest = new Request(correctedUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })

    // Debug: Check headers after creating new Request
    console.log(
      '[Mobile Route] After new Request - auth header:',
      correctedRequest.headers.get('authorization'),
    )
    console.log(
      '[Mobile Route] After new Request - x-auth-token:',
      correctedRequest.headers.get('x-auth-token'),
    )

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

// Export as edge runtime to bypass Node.js middleware
export const runtime = 'edge'

export { handler as GET, handler as POST }
