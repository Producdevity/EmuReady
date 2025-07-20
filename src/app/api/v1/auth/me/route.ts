import { type NextRequest } from 'next/server'
import { authenticate } from '@/server/lib/rest/auth'
import {
  apiResponse,
  apiError,
  handleOptions,
} from '@/server/lib/rest/response'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)

    if (!user) {
      return apiError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    return apiResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      showNsfw: user.showNsfw,
    })
  } catch (error) {
    return apiError(error)
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
