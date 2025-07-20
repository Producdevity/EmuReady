import { verifyToken } from '@clerk/backend'
import { type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import { RestApiError } from './errors'
import type { Role } from '@orm'

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
  role: Role
  showNsfw: boolean
}

/**
 * Authenticates a REST API request using Clerk JWT
 * Similar to how mobile tRPC context works
 * @param request - Next.js request object
 * @returns User object if authenticated, null otherwise
 */
export async function authenticate(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    // Verify JWT with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })

    const clerkUserId = payload.sub

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        showNsfw: true,
      },
    })

    if (!user) {
      console.warn(`User with clerkId ${clerkUserId} not found in database`)
      return null
    }

    return user
  } catch (error) {
    // Invalid or expired token
    if (process.env.NODE_ENV === 'development') {
      console.warn('REST API authentication failed:', error)
    }
    return null
  }
}

/**
 * Middleware to require authentication
 * Throws an error if the user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await authenticate(request)

  if (!user) {
    throw new RestApiError(401, 'UNAUTHORIZED', 'Authentication required')
  }

  return user
}

/**
 * Middleware to require a specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Role[],
): Promise<AuthUser> {
  const user = await requireAuth(request)

  if (!allowedRoles.includes(user.role)) {
    throw new RestApiError(403, 'FORBIDDEN', 'Insufficient permissions')
  }

  return user
}
