import { prisma } from '@/server/db'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { DeviceService } from '@/server/services/devices/device.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/device-brands
 * Get all device brands
 */
export async function GET() {
  try {
    // Use service layer
    const service = new DeviceService(prisma)
    const brands = await service.findBrands()

    return apiResponse(brands)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
