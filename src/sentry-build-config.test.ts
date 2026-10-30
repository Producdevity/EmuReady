import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('injects the supplied build commit into client bundle configuration', async () => {
  const revision = 'a'.repeat(40)
  vi.stubEnv('NEXT_PUBLIC_ENABLE_SENTRY', 'true')
  vi.stubEnv('NEXT_BUILD_ID', revision)
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('SENTRY_RELEASE', '')

  const config = (await import('../next.config')).default

  expect(config).toHaveProperty('env._sentryRelease', revision)
})
