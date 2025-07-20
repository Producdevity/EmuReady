import { createGetByIdHandler } from '@/server/lib/rest/handlers'
import { handleOptions } from '@/server/lib/rest/response'
import { DeviceService } from '@/server/services/devices/device.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/devices/:id
 * Get a single device by ID
 */
export const GET = createGetByIdHandler(DeviceService)

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
