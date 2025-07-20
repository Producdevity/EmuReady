import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { parseQuery } from '@/server/lib/rest/validation'
import { GameService } from '@/server/services/games/game.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

const SearchGamesQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

/**
 * GET /api/v1/games/search
 * Search games by title
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { q, limit } = parseQuery(
      request.nextUrl.searchParams,
      SearchGamesQuerySchema,
    )

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new GameService(prisma)
    const games = await service.search(
      q,
      limit,
      user ? { id: user.id, showNsfw: user.showNsfw } : null,
    )

    return apiResponse(games)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
