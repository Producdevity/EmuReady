import { type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'
import { EmulatorService } from '@/server/services/emulators/emulator.service'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/emulators/:id
 * Get a single emulator by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    // Use service layer
    const service = new EmulatorService(prisma)
    const emulator = await service.findById(id)

    if (!emulator) {
      return apiError({
        code: 'NOT_FOUND',
        message: 'Emulator not found',
      })
    }

    return apiResponse(emulator)
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
