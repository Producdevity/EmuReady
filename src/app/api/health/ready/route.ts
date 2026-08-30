import { readFile } from 'node:fs/promises'
import { freemem, totalmem } from 'node:os'
import { connection, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { prisma } from '@/server/db'

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

interface MemoryStats {
  used: number
  total: number
  percentage: number
}

interface MemoryValues {
  cgroupUsed: number | null
  cgroupLimit: number | null
  hostTotal: number
  hostFree: number
}

async function readMemoryValue(path: string): Promise<number | null> {
  try {
    const value = Number.parseInt((await readFile(path, 'utf8')).trim(), 10)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export function calculateMemoryStats(values: MemoryValues): MemoryStats {
  const hasCgroupLimit =
    values.cgroupUsed !== null &&
    values.cgroupLimit !== null &&
    values.cgroupLimit > 0 &&
    values.cgroupLimit <= values.hostTotal
  let usedBytes = values.hostTotal - values.hostFree
  let totalBytes = values.hostTotal

  if (hasCgroupLimit && values.cgroupUsed !== null && values.cgroupLimit !== null) {
    usedBytes = values.cgroupUsed
    totalBytes = values.cgroupLimit
  }

  return {
    used: Math.round(usedBytes / 1024 / 1024),
    total: Math.round(totalBytes / 1024 / 1024),
    percentage: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0,
  }
}

async function getMemoryStats(): Promise<MemoryStats> {
  const [cgroupUsed, cgroupLimit] = await Promise.all([
    readMemoryValue('/sys/fs/cgroup/memory.current'),
    readMemoryValue('/sys/fs/cgroup/memory.max'),
  ])
  return calculateMemoryStats({
    cgroupUsed,
    cgroupLimit,
    hostTotal: totalmem(),
    hostFree: freemem(),
  })
}

/**
 * Readiness probe — confirms the process is up AND its dependencies (database,
 * auth configuration) are reachable. Use for load-balancer/Coolify readiness
 * gates, not for a fast liveness check (use /api/health/live for that).
 * @openapi
 * /api/health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server readiness check
 *     description: Returns the current health status of the server and its dependencies
 *     responses:
 *       200:
 *         description: Server is healthy and dependencies are reachable
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
export async function GET() {
  await connection()

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    const memory = await getMemoryStats()

    const authAvailable = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
    )

    const healthData: HealthResponse = {
      status: authAvailable ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.APP_VERSION || 'unknown',
      environment: env.APP_ENV,
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
        memory,
        nodeVersion: process.version,
      },
    }

    return NextResponse.json(healthData, {
      status: authAvailable ? 200 : 503,
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
