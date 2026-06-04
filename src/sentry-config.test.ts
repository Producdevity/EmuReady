import { afterEach, describe, expect, it, vi } from 'vitest'

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => sentry)

async function loadSentryConfigs(overrides: Record<string, string>) {
  vi.resetModules()
  vi.unstubAllEnvs()

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }

  await import('../sentry.server.config')
  await import('../sentry.edge.config')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('Sentry server and edge config', () => {
  it('does not initialize when the Sentry flag is disabled', async () => {
    await loadSentryConfigs({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_SENTRY: 'false',
    })

    expect(sentry.init).not.toHaveBeenCalled()
  })

  it('initializes server and edge Sentry when the Sentry flag is enabled', async () => {
    await loadSentryConfigs({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_SENTRY: 'true',
    })

    expect(sentry.init).toHaveBeenCalledTimes(2)
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: expect.stringContaining('ingest.us.sentry.io'),
      }),
    )
  })
})
