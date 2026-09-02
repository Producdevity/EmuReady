import { beforeEach, describe, expect, it, vi } from 'vitest'

const healthMocks = vi.hoisted(() => ({
  connection: vi.fn(),
  checkDatabase: vi.fn(),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/server')
  return { ...actual, connection: healthMocks.connection }
})

vi.mock('@/features/health/server/health.service', () => ({
  createHealthService: () => ({ checkDatabase: healthMocks.checkDatabase }),
}))

vi.mock('@/server/db', () => ({ prisma: {} }))

const { GET } = await import('./route')

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    healthMocks.checkDatabase.mockResolvedValue(undefined)
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test')
  })

  it('reports ready without exposing dependency diagnostics', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'healthy' })
    expect(healthMocks.checkDatabase).toHaveBeenCalledOnce()
  })

  it('does not require the build-time Clerk publishable key at runtime', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '')

    const response = await GET()

    expect(response.status).toBe(200)
  })

  it('reports not ready when auth configuration is missing', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ status: 'unhealthy' })
  })

  it('reports not ready when the database cannot be reached', async () => {
    healthMocks.checkDatabase.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ status: 'unhealthy' })
  })
})
