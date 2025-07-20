import { type NextRequest } from 'next/server'
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
 * GET /api/v1/listings/featured
 * Get featured listings (highest voted)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional authentication
    const user = await authenticate(request)

    // Use service layer
    const service = new ListingService(prisma)
    const listings = await service.findFeatured(
      user ? { id: user.id, showNsfw: user.showNsfw } : null,
    )

    return apiResponse(listings)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
