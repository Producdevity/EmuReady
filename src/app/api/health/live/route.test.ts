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

  it('reports process liveness without exposing diagnostics', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'alive' })
  })
})
