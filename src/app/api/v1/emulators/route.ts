import { createListHandler } from '@/server/lib/rest/handlers'
import { handleOptions } from '@/server/lib/rest/response'
import { EmulatorService } from '@/server/services/emulators/emulator.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/emulators
 * Get paginated emulators with optional search
 */
export const GET = createListHandler(EmulatorService)

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
