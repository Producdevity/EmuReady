import { afterEach, describe, expect, it, vi } from 'vitest'

const sentry = vi.hoisted(() => ({
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}))

vi.mock('@sentry/nextjs', () => sentry)

async function loadInstrumentationClient(overrides: Record<string, string>) {
  vi.resetModules()
  vi.unstubAllEnvs()

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }

  return import('./instrumentation-client')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('instrumentation-client', () => {
  it('does not initialize Sentry when the Sentry flag is disabled', async () => {
    await loadInstrumentationClient({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_SENTRY: 'false',
    })

    expect(sentry.init).not.toHaveBeenCalled()
    expect(sentry.replayIntegration).not.toHaveBeenCalled()
  })

  it('initializes Sentry when the Sentry flag is enabled', async () => {
    await loadInstrumentationClient({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_SENTRY: 'true',
    })

    expect(sentry.replayIntegration).toHaveBeenCalledTimes(1)
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: expect.stringContaining('ingest.us.sentry.io'),
        integrations: [{ name: 'replay' }],
      }),
    )
  })
})
