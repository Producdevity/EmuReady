import { TRPCError } from '@trpc/server'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { validateAndConsumeApiKey } from '@/lib/api/validateApiKey'
import { GetDeviceCompatibilitySchema } from '@/schemas/mobile'
import { prisma } from '@/server/db'
import { getDeviceCompatibility } from '@/server/services/catalog.service'

/**
 * GET /api/catalog/compatibility
 *
 * REST endpoint for device compatibility scores.
 * Provides the same functionality as the tRPC endpoint but as a standard REST API.
 *
 * Query Parameters:
 * - deviceId: Device UUID (optional)
 * - deviceModelName: Device model name (optional)
 * - deviceBrandName: Device brand name (optional)
 * - systemIds: Comma-separated system UUIDs (optional)
 * - includeEmulatorBreakdown: Include per-emulator scores (optional, default: true)
 * - minListingCount: Minimum listings to include a system (optional, default: 1)
 *
 * Either deviceId OR both deviceModelName and deviceBrandName must be provided.
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key and enforce quota limits
    const apiKey = await validateAndConsumeApiKey(request)

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams

    const deviceId = searchParams.get('deviceId') ?? undefined
    const deviceModelName = searchParams.get('deviceModelName') ?? undefined
    const deviceBrandName = searchParams.get('deviceBrandName') ?? undefined
    const systemIdsParam = searchParams.get('systemIds')
    const includeEmulatorBreakdownParam = searchParams.get('includeEmulatorBreakdown')
    const minListingCountParam = searchParams.get('minListingCount')

    // Parse array and boolean parameters
    const systemIds = systemIdsParam ? systemIdsParam.split(',').filter(Boolean) : undefined
    const includeEmulatorBreakdown =
      includeEmulatorBreakdownParam !== null ? includeEmulatorBreakdownParam === 'true' : undefined
    const minListingCount = minListingCountParam ? parseInt(minListingCountParam, 10) : undefined

    // Validate input with Zod schema
    const input = GetDeviceCompatibilitySchema.parse({
      deviceId,
      deviceModelName,
      deviceBrandName,
      systemIds,
      includeEmulatorBreakdown,
      minListingCount,
    })

    const result = await getDeviceCompatibility(input, {
      prisma,
      userRole: apiKey.user.role,
      userId: apiKey.user.id,
    })

    // Return JSON response
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    // Handle TRPCError (includes auth, quota, and other custom errors)
    if (error instanceof TRPCError) {
      const statusCodeMap: Record<string, number> = {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
      }
      const statusCode = statusCodeMap[error.code] || 500
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: statusCode },
      )
    }

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 },
      )
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 },
      )
    }

    // Handle unexpected errors
    console.error('Catalog compatibility API error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
