import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: {
      status: 'connected' | 'disconnected'
      latency?: number
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

/**
 * Health check endpoint for monitoring and load balancers
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server health check
 *     description: Returns the current health status of the server and its dependencies
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   description: Application version
 *                 environment:
 *                   type: string
 *                   description: Current environment
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [connected, disconnected]
 *                         latency:
 *                           type: number
 *                           description: Database response time in ms
 *                     auth:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [available, unavailable]
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                         total:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                     nodeVersion:
 *                       type: string
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   description: Error message
 */
export async function GET(_request: NextRequest) {
  try {
    // Test database connectivity
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    // Get memory usage
    const memUsage = process.memoryUsage()
    const memoryUsed = memUsage.rss
    const memoryTotal = memUsage.rss + memUsage.external
    const memoryPercentage = Math.round((memoryUsed / memoryTotal) * 100)

    // Check if Clerk environment variables are set
    const authAvailable = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
    )

    const healthData: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '0.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        database: {
          status: 'connected',
          latency: dbLatency,
        },
        auth: {
          status: authAvailable ? 'available' : 'unavailable',
        },
      },
      system: {
        memory: {
          used: Math.round(memoryUsed / 1024 / 1024), // MB
          total: Math.round(memoryTotal / 1024 / 1024), // MB
          percentage: memoryPercentage,
        },
        nodeVersion: process.version,
      },
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    const unhealthyResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }

    return NextResponse.json(unhealthyResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  }
}
