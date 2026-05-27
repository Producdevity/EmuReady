import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv(overrides: Record<string, string>) {
  vi.resetModules()
  vi.unstubAllEnvs()

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }

  return import('./env')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('env', () => {
  it('uses explicit public app env for public production checks', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
    })

    expect(env.APP_ENV).toBe('production')
    expect(env.IS_PUBLIC_PRODUCTION).toBe(true)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('does not infer public production from a production build without explicit app env', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: '',
    })

    expect(env.APP_ENV).toBe('local')
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('uses explicit public preview app env for Vercel preview builds', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'preview',
    })

    expect(env.APP_ENV).toBe('preview')
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('falls back to test app env for test runs when app env is omitted', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_ENV: '',
    })

    expect(env.APP_ENV).toBe('test')
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_TEST_BUILD).toBe(true)
  })

  it('only enables optional browser services when their public flags are true', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NEXT_PUBLIC_ENABLE_KOFI_WIDGET: 'false',
      NEXT_PUBLIC_ENABLE_SENTRY: 'true',
    })

    expect(env.ENABLE_ANALYTICS).toBe(true)
    expect(env.ENABLE_KOFI_WIDGET).toBe(false)
    expect(env.ENABLE_SENTRY).toBe(true)
  })
})
