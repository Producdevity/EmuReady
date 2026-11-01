import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
  initializeServerOnce: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  init: mocks.init,
  captureRequestError: mocks.captureRequestError,
}))
vi.mock('./server/init', () => ({ initializeServerOnce: mocks.initializeServerOnce }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

async function loadInstrumentation(runtime: string, enabled = true) {
  vi.resetModules()
  vi.stubEnv('NEXT_RUNTIME', runtime)
  vi.stubEnv('NEXT_PUBLIC_ENABLE_SENTRY', String(enabled))
  vi.stubEnv('NEXT_PHASE', '')
  return import('./instrumentation')
}

describe('server instrumentation entry point', () => {
  it('initializes Sentry before starting Node server services', async () => {
    const instrumentation = await loadInstrumentation('nodejs')
    await instrumentation.register()

    expect(mocks.init).toHaveBeenCalledTimes(1)
    expect(mocks.initializeServerOnce).toHaveBeenCalledTimes(1)
    expect(mocks.init.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.initializeServerOnce.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('does not initialize Node services in an unsupported runtime', async () => {
    const instrumentation = await loadInstrumentation('edge')
    await instrumentation.register()

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.initializeServerOnce).not.toHaveBeenCalled()
  })

  it('starts services with Sentry disabled', async () => {
    const instrumentation = await loadInstrumentation('nodejs', false)
    await instrumentation.register()

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.initializeServerOnce).toHaveBeenCalledTimes(1)
  })

  it('skips runtime initialization during the production build', async () => {
    const instrumentation = await loadInstrumentation('nodejs')
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    await instrumentation.register()

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.initializeServerOnce).not.toHaveBeenCalled()
  })

  it('exports the Sentry server-request error handler', async () => {
    const instrumentation = await loadInstrumentation('nodejs')
    expect(instrumentation).toHaveProperty('onRequestError', mocks.captureRequestError)
  })
})
