import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { parseBody } from '@/server/lib/rest/validation'
import { UserService } from '@/server/services/users/user.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/users/:id
 * Get user profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const service = new UserService(prisma)
    const user = await service.findById(id)
    return apiResponse(user)
  } catch (error) {
    return apiError(error)
  }
}

const UpdateUserBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  showNsfw: z.boolean().optional(),
  profileImage: z.string().url().optional(),
})

/**
 * PUT /api/v1/users/:id
 * Update user profile (owner or admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await authenticate(request)
    if (!currentUser) {
      return apiError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    const { id } = params
    const body = await parseBody(request, UpdateUserBodySchema)

    const service = new UserService(prisma)
    const updatedUser = await service.update(id, currentUser.id, body)

    return apiResponse(updatedUser)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
