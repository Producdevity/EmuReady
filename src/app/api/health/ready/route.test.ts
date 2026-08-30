import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateMemoryStats, GET } from './route'
const healthMocks = vi.hoisted(() => ({
  connection: vi.fn(),
  query: vi.fn(),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/server')
  return { ...actual, connection: healthMocks.connection }
})

vi.mock('@/server/db', () => ({
  prisma: { $queryRaw: healthMocks.query },
}))

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    healthMocks.query.mockResolvedValue([{ '?column?': 1 }])
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test')
    vi.stubEnv('APP_VERSION', 'test-deployment')
  })

  it('reports ready when the database and auth configuration are available', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.version).toBe('test-deployment')
    expect(body.environment).toBe('test')
    expect(body.services.database.status).toBe('connected')
    expect(body.services.auth.status).toBe('available')
  })

  it('calculates container memory against the cgroup limit', () => {
    expect(
      calculateMemoryStats({
        cgroupUsed: 512 * 1024 * 1024,
        cgroupLimit: 4 * 1024 * 1024 * 1024,
        hostTotal: 24 * 1024 * 1024 * 1024,
        hostFree: 12 * 1024 * 1024 * 1024,
      }),
    ).toEqual({ used: 512, total: 4096, percentage: 13 })
  })

  it('falls back to host memory when there is no cgroup limit', () => {
    expect(
      calculateMemoryStats({
        cgroupUsed: null,
        cgroupLimit: null,
        hostTotal: 4 * 1024 * 1024 * 1024,
        hostFree: 3 * 1024 * 1024 * 1024,
      }),
    ).toEqual({ used: 1024, total: 4096, percentage: 25 })
  })

  it('reports not ready when auth configuration is missing', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.services.database.status).toBe('connected')
    expect(body.services.auth.status).toBe('unavailable')
  })

  it('reports not ready when the database cannot be reached', async () => {
    healthMocks.query.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('unhealthy')
    expect(body.error).toBe('Health check failed')
  })
})
