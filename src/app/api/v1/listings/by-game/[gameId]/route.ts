import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { ListingService } from '@/server/services/listings/listing.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/listings/by-game/:gameId
 * Get all listings for a specific game
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } },
) {
  try {
    // Validate game ID
    const gameId = z.string().uuid().parse(params.gameId)

    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new ListingService(prisma)
    const listings = await service.findByGame(
      gameId,
      user ? { id: user.id, showNsfw: user.showNsfw } : null,
    )

    return apiResponse(listings)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
