import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiError,
  paginatedResponse,
  handleOptions,
} from '@/server/lib/rest/response'
import { parseQuery } from '@/server/lib/rest/validation'
import { GameService } from '@/server/services/games/game.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

const GetGamesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  systemId: z.string().uuid().optional(),
})

/**
 * GET /api/v1/games
 * Get paginated games with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const params = parseQuery(request.nextUrl.searchParams, GetGamesQuerySchema)

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new GameService(prisma)
    const result = await service.findMany({
      ...params,
      user: user ? { id: user.id, showNsfw: user.showNsfw } : null,
    })

    return paginatedResponse(result.items, result.pagination)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
