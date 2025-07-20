import { type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { GameService } from '@/server/services/games/game.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/games/:id
 * Get a single game by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new GameService(prisma)
    const game = await service.findById(
      id,
      user ? { id: user.id, showNsfw: user.showNsfw } : null,
    )

    if (!game) {
      return apiError({
        code: 'NOT_FOUND',
        message: 'Game not found',
      })
    }

    return apiResponse(game)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
