import { afterEach, describe, expect, it, vi } from 'vitest'

const ENV_KEYS = {
  nodeEnv: 'NODE_ENV',
  appEnv: 'NEXT_PUBLIC_APP_ENV',
  enableAnalytics: 'NEXT_PUBLIC_ENABLE_ANALYTICS',
  enableKofiWidget: 'NEXT_PUBLIC_ENABLE_KOFI_WIDGET',
  enableSentry: 'NEXT_PUBLIC_ENABLE_SENTRY',
} as const

const ENV_VALUES = {
  empty: '',
  false: 'false',
  local: 'local',
  preview: 'preview',
  production: 'production',
  test: 'test',
  true: 'true',
} as const

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
      [ENV_KEYS.nodeEnv]: ENV_VALUES.production,
      [ENV_KEYS.appEnv]: ENV_VALUES.production,
    })

    expect(env.APP_ENV).toBe(ENV_VALUES.production)
    expect(env.IS_PUBLIC_PRODUCTION).toBe(true)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('does not infer public production from a production build without explicit app env', async () => {
    const { env } = await loadEnv({
      [ENV_KEYS.nodeEnv]: ENV_VALUES.production,
      [ENV_KEYS.appEnv]: ENV_VALUES.empty,
    })

    expect(env.APP_ENV).toBe(ENV_VALUES.local)
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('uses explicit public preview app env for Vercel preview builds', async () => {
    const { env } = await loadEnv({
      [ENV_KEYS.nodeEnv]: ENV_VALUES.production,
      [ENV_KEYS.appEnv]: ENV_VALUES.preview,
    })

    expect(env.APP_ENV).toBe(ENV_VALUES.preview)
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_PRODUCTION_BUILD).toBe(true)
  })

  it('falls back to test app env for test runs when app env is omitted', async () => {
    const { env } = await loadEnv({
      [ENV_KEYS.nodeEnv]: ENV_VALUES.test,
      [ENV_KEYS.appEnv]: ENV_VALUES.empty,
    })

    expect(env.APP_ENV).toBe(ENV_VALUES.test)
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_TEST_BUILD).toBe(true)
  })

  it('uses the test app env when a test run inherits a deployment app env', async () => {
    const { env } = await loadEnv({
      [ENV_KEYS.nodeEnv]: ENV_VALUES.test,
      [ENV_KEYS.appEnv]: ENV_VALUES.production,
    })

    expect(env.APP_ENV).toBe(ENV_VALUES.test)
    expect(env.IS_PUBLIC_PRODUCTION).toBe(false)
    expect(env.IS_TEST_BUILD).toBe(true)
  })

  it('only enables optional browser services when their public flags are true', async () => {
    const { env } = await loadEnv({
      [ENV_KEYS.nodeEnv]: ENV_VALUES.production,
      [ENV_KEYS.appEnv]: ENV_VALUES.production,
      [ENV_KEYS.enableAnalytics]: ENV_VALUES.true,
      [ENV_KEYS.enableKofiWidget]: ENV_VALUES.false,
      [ENV_KEYS.enableSentry]: ENV_VALUES.true,
    })

    expect(env.ENABLE_ANALYTICS).toBe(true)
    expect(env.ENABLE_KOFI_WIDGET).toBe(false)
    expect(env.ENABLE_SENTRY).toBe(true)
  })
})
