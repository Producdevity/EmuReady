import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test')
    vi.stubEnv('APP_VERSION', 'commit-sha')
    healthMocks.checkDatabase.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('preserves the detailed legacy health response', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    expect(body).toMatchObject({
      status: 'healthy',
      version: 'commit-sha',
      services: {
        database: { status: 'connected', latency: expect.any(Number) },
        auth: { status: 'available' },
      },
      system: {
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
        },
        nodeVersion: expect.any(String),
      },
    })
    expect(body.timestamp).toEqual(expect.any(String))
    expect(body.uptime).toEqual(expect.any(Number))
    expect(healthMocks.connection).toHaveBeenCalledOnce()
    expect(healthMocks.checkDatabase).toHaveBeenCalledOnce()
  })

  it('preserves the legacy unavailable auth status', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.services.auth).toEqual({ status: 'unavailable' })
  })

  it('preserves the legacy unhealthy response when the database check fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    healthMocks.checkDatabase.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ status: 'unhealthy', error: 'Health check failed' })
    expect(body.timestamp).toEqual(expect.any(String))
    expect(consoleError).toHaveBeenCalled()
  })
})
