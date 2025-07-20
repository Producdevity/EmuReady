import { type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  paginatedResponse,
  handleOptions,
} from '@/server/lib/rest/response'
import {
  parseQuery,
  parseBody,
  GetListingsQuerySchema,
  CreateListingBodySchema,
} from '@/server/lib/rest/validation'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/listings
 * Get paginated listings with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const params = parseQuery(
      request.nextUrl.searchParams,
      GetListingsQuerySchema,
    )

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new ListingService(prisma)
    const result = await service.findMany({
      ...params,
      user: user ? { id: user.id, showNsfw: user.showNsfw } : null,
    })

    return paginatedResponse(result.items, result.pagination)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * POST /api/v1/listings
 * Create a new listing (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await authenticate(request)
    if (!user) {
      return apiError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    // Parse request body
    const body = await parseBody(request, CreateListingBodySchema)

    // Use service layer
    const service = new ListingService(prisma)
    const listing = await service.create({
      ...body,
      authorId: user.id,
    })

    return apiResponse(listing, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// Add CORS headers to all responses
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
