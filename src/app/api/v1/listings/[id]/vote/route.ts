import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { parseBody, VoteListingBodySchema } from '@/server/lib/rest/validation'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * POST /api/v1/listings/:id/vote
 * Vote on a listing (requires authentication)
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
    const body = await parseBody(request, VoteListingBodySchema)

    // Use service layer
    const service = new ListingService(prisma)
    const vote = await service.vote({
      listingId,
      value: body.value,
      userId: user.id,
    })

    return apiResponse(vote)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * GET /api/v1/listings/:id/vote
 * Get user's vote on a listing (requires authentication)
 */
export async function GET(
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

    // Use service layer
    const service = new ListingService(prisma)
    const userVote = await service.getUserVote(listingId, user.id)

    return apiResponse({ value: userVote })
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
