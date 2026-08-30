import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const healthMocks = vi.hoisted(() => ({
  connection: vi.fn(),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/server')
  return { ...actual, connection: healthMocks.connection }
})

describe('GET /api/health/live', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('reports process liveness without checking dependencies', async () => {
    vi.stubEnv('APP_VERSION', 'test-deployment')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('alive')
    expect(body.version).toBe('test-deployment')
    expect(body.environment).toBe('test')
  })

  it('uses an explicit fallback when no build version is available', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.version).toBe('unknown')
  })
})
