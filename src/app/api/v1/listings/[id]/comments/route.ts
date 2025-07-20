import { type NextRequest } from 'next/server'
import { z } from 'zod'
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
  PaginationSchema,
  CreateCommentBodySchema,
} from '@/server/lib/rest/validation'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/listings/:id/comments
 * Get comments for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate listing ID
    const listingId = z.string().uuid().parse(params.id)

    // Parse pagination
    const { page, limit } = parseQuery(
      request.nextUrl.searchParams,
      PaginationSchema,
    )

    // Optional authentication (for user's vote on comments)
    const user = await authenticate(request)

    // Use service layer
    const service = new ListingService(prisma)
    const result = await service.getComments({
      listingId,
      page,
      limit,
      userId: user?.id,
    })

    return paginatedResponse(result.items, result.pagination)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * POST /api/v1/listings/:id/comments
 * Create a comment on a listing (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate listing ID
    const listingId = z.string().uuid().parse(params.id)

    // Require authentication
    const user = await authenticate(request)
    if (!user) {
      return apiError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    // Parse request body
    const body = await parseBody(request, CreateCommentBodySchema)

    // Use service layer
    const service = new ListingService(prisma)
    const comment = await service.createComment({
      listingId,
      content: body.content,
      userId: user.id,
    })

    return apiResponse(comment, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
