import { connection, NextResponse } from 'next/server'
import { createHealthService } from '@/features/health/server/health.service'
import { prisma } from '@/server/db'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

/**
 * Dependency-aware readiness probe for container and load-balancer health
 * checks. Public responses intentionally expose only the aggregate status.
 * @openapi
 * /api/health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server readiness check
 *     responses:
 *       200:
 *         description: Server is ready
 *       503:
 *         description: Server is not ready
 */
export async function GET() {
  await connection()

  try {
    await createHealthService(prisma).checkDatabase()

    const authAvailable = Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
    )

    return NextResponse.json(
      { status: authAvailable ? 'healthy' : 'unhealthy' },
      {
        status: authAvailable ? 200 : 503,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      { status: 'unhealthy' },
      {
        status: 503,
        headers: NO_CACHE_HEADERS,
      },
    )
  }
}
