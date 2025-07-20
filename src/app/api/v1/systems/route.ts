import { prisma } from '@/server/db'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { SystemService } from '@/server/services/systems/system.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/systems
 * Get all systems (gaming consoles/platforms)
 */
export async function GET() {
  try {
    // Use service layer
    const service = new SystemService(prisma)
    const systems = await service.findAll()

    return apiResponse(systems)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
