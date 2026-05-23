import { TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'
import { connection, type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { validateAndConsumeApiKey } from '@/lib/api/validateApiKey'
import { ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
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
  await connection()

  try {
    const apiKey = await validateAndConsumeApiKey(request)

    const searchParams = request.nextUrl.searchParams

    const deviceId = searchParams.get('deviceId') ?? undefined
    const deviceModelName = searchParams.get('deviceModelName') ?? undefined
    const deviceBrandName = searchParams.get('deviceBrandName') ?? undefined
    const systemIdsParam = searchParams.get('systemIds')
    const includeEmulatorBreakdownParam = searchParams.get('includeEmulatorBreakdown')
    const minListingCountParam = searchParams.get('minListingCount')

    const systemIds = systemIdsParam ? systemIdsParam.split(',').filter(Boolean) : undefined
    const includeEmulatorBreakdown =
      includeEmulatorBreakdownParam !== null ? includeEmulatorBreakdownParam === 'true' : undefined
    const minListingCount = minListingCountParam ? parseInt(minListingCountParam, 10) : undefined

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

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // This endpoint consumes API-key quota and may include role-scoped visibility.
        // Keep intermediary caches out of the path; the service still uses its own LRU.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: getHTTPStatusCodeFromError(error) },
      )
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: error.message,
          },
        },
        { status: 404 },
      )
    }

    logger.error('Catalog compatibility API error:', error)
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
