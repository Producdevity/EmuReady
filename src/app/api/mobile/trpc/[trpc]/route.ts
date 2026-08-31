import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { connection, type NextRequest, NextResponse } from 'next/server'
import { getCORSHeaders } from '@/lib/cors'
import { createMobileTRPCFetchContext } from '@/server/api/mobileContext'
import { mobileRouter } from '@/server/api/routers/mobile'
import { getTRPCResponseCacheHeaders, TRPC_PRIVATE_CACHE_CONTROL } from '@/server/api/trpc-cache'

// Get CORS headers with additional tRPC headers
function getTRPCCorsHeaders(request: NextRequest) {
  const baseHeaders = getCORSHeaders(request)
  return {
    ...baseHeaders,
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

function mergeVaryHeader(existing: string | null, next: string): string {
  const values = new Set<string>()

  for (const value of [existing, next]) {
    if (!value) continue

    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => values.add(entry))
  }

  return [...values].join(', ')
}

function setResponseHeader(response: Response, key: string, value: string) {
  if (key.toLowerCase() === 'vary') {
    response.headers.set(key, mergeVaryHeader(response.headers.get(key), value))
    return
  }

  response.headers.set(key, value)
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
      responseMeta(opts) {
        return {
          headers: {
            ...corsHeaders,
            ...getTRPCResponseCacheHeaders({
              endpoint: 'mobile',
              method: req.method,
              type: opts.type,
              info: opts.info,
              hasErrors: opts.errors.length > 0,
              eagerGeneration: opts.eagerGeneration,
              session: opts.ctx?.session,
              apiKey: opts.ctx?.apiKey,
              headers: opts.ctx?.headers,
            }),
          },
        }
      },
    })

    // Ensure CORS headers are set on the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      setResponseHeader(response, key, value)
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
          'Cache-Control': TRPC_PRIVATE_CACHE_CONTROL,
          ...corsHeaders,
        },
      },
    )
  }
}

async function GET(req: NextRequest) {
  await connection()
  return handler(req)
}

export { GET, handler as POST }
