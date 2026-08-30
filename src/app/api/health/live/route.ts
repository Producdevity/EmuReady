import { connection, NextResponse } from 'next/server'

/**
 * Liveness probe — confirms the process is up and serving HTTP. Performs no
 * dependency I/O (no database query) so it stays fast and independent of
 * downstream health. Use this for container/orchestrator liveness gates; use
 * /api/health/ready for a dependency-aware readiness check.
 * @openapi
 * /api/health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe
 *     description: Lightweight process liveness check with no dependency I/O
 *     responses:
 *       200:
 *         description: Process is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [alive]
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 */
export async function GET() {
  await connection()

  return NextResponse.json(
    {
      status: 'alive',
      uptime: Math.floor(process.uptime()),
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    },
  )
}
