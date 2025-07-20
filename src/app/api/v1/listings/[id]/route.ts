import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  emptyResponse,
  handleOptions,
} from '@/server/lib/rest/response'
import {
  parseBody,
  UpdateListingBodySchema,
} from '@/server/lib/rest/validation'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/listings/:id
 * Get a single listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate ID
    const id = z.string().uuid().parse(params.id)

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new ListingService(prisma)
    const listing = await service.findById(
      id,
      user ? { id: user.id, showNsfw: user.showNsfw } : null,
    )

    if (!listing) {
      return apiError({
        code: 'NOT_FOUND',
        message: 'Listing not found',
      })
    }

    return apiResponse(listing)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * PUT /api/v1/listings/:id
 * Update a listing (requires authentication and ownership)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate ID
    const id = z.string().uuid().parse(params.id)

    // Require authentication
    const user = await authenticate(request)
    if (!user) {
      return apiError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    // Parse request body
    const body = await parseBody(request, UpdateListingBodySchema)

    // Use service layer
    const service = new ListingService(prisma)
    const listing = await service.update({
      id,
      ...body,
      userId: user.id,
    })

    return apiResponse(listing)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * DELETE /api/v1/listings/:id
 * Delete a listing (requires authentication and ownership or moderator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate ID
    const id = z.string().uuid().parse(params.id)

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
    await service.delete(id, user.id)

    return emptyResponse()
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
