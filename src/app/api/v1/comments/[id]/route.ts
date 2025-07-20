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
  UpdateCommentBodySchema,
} from '@/server/lib/rest/validation'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * PUT /api/v1/comments/:id
 * Update a comment (requires authentication and ownership)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate comment ID
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
    const body = await parseBody(request, UpdateCommentBodySchema)

    // Use service layer
    const service = new ListingService(prisma)
    const comment = await service.updateComment({
      id,
      content: body.content,
      userId: user.id,
    })

    return apiResponse(comment)
  } catch (error) {
    return apiError(error)
  }
}

/**
 * DELETE /api/v1/comments/:id
 * Delete a comment (requires authentication and ownership or moderator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate comment ID
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
    await service.deleteComment({
      id,
      userId: user.id,
    })

    return emptyResponse()
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
