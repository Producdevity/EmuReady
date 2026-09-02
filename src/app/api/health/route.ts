import { connection, NextResponse } from 'next/server'
import { createHealthService } from '@/features/health/server/health.service'
import { prisma } from '@/server/db'

interface HealthResponse {
  status: 'healthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: {
      status: 'connected'
      latency: number
    }
    auth: {
      status: 'available' | 'unavailable'
    }
  }
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    nodeVersion: string
  }
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

/**
 * Legacy detailed health endpoint retained for existing monitoring consumers.
 * New container checks should use /api/health/live and /api/health/ready.
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server health check
 *     responses:
 *       200:
 *         description: Server is healthy
 *       503:
 *         description: Server is unhealthy
 */
export async function GET() {
  await connection()

  try {
    const dbStart = Date.now()
    await createHealthService(prisma).checkDatabase()
    const dbLatency = Date.now() - dbStart

    const memUsage = process.memoryUsage()
    const memoryUsed = memUsage.rss
    const memoryTotal = memUsage.rss + memUsage.external

    const healthData: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.APP_VERSION || process.env.npm_package_version || '0.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        database: {
          status: 'connected',
          latency: dbLatency,
        },
        auth: {
          status:
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
              ? 'available'
              : 'unavailable',
        },
      },
      system: {
        memory: {
          used: Math.round(memoryUsed / 1024 / 1024),
          total: Math.round(memoryTotal / 1024 / 1024),
          percentage: Math.round((memoryUsed / memoryTotal) * 100),
        },
        nodeVersion: process.version,
      },
    }

    return NextResponse.json(healthData, { status: 200, headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503, headers: NO_CACHE_HEADERS },
    )
  }
}
