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
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('Sentry server config', () => {
  it.each([undefined, ''])(
    'preserves the SDK release fallback when APP_VERSION is %s',
    async (version) => {
      vi.resetModules()
      vi.stubEnv('NEXT_PUBLIC_ENABLE_SENTRY', 'true')
      vi.stubEnv('APP_VERSION', version)

      await import('../sentry.server.config')

      expect(sentry.init).toHaveBeenCalledTimes(1)
      expect(sentry.init.mock.calls[0]?.[0]).not.toHaveProperty('release')
    },
  )

  it('does not initialize when the Sentry flag is disabled', async () => {
    await loadSentryConfigs({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_SENTRY: 'false',
    })

    expect(sentry.init).not.toHaveBeenCalled()
  })

  it.each(['production', 'staging'])('labels server errors for %s', async (environment) => {
    await loadSentryConfigs({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: environment,
      NEXT_PUBLIC_ENABLE_SENTRY: 'true',
      APP_VERSION: 'test-release',
    })

    expect(sentry.init).toHaveBeenCalledTimes(1)
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: expect.stringContaining('ingest.us.sentry.io'),
        environment,
        release: 'test-release',
      }),
    )
  })

  it('uses the shared environment fallback for an invalid app environment', async () => {
    await loadSentryConfigs({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'invalid',
      NEXT_PUBLIC_ENABLE_SENTRY: 'true',
    })

    expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({ environment: 'local' }))
  })
})
