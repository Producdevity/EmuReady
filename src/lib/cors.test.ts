import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const allowedOrigins = ['https://emuready.com', 'capacitor://localhost']

async function loadCors(overrides: Record<string, string> = {}) {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv('ALLOWED_ORIGINS', '')
  vi.stubEnv('NEXT_PUBLIC_ALLOWED_ORIGINS', '')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
  vi.stubEnv('CI', '')
  vi.stubEnv('PLAYWRIGHT_TEST', '')

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }

  return import('./cors')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getOriginFromUrl', () => {
  it('normalizes full URLs to their origin', async () => {
    const { getOriginFromUrl } = await loadCors()

    expect(getOriginFromUrl('https://emuready.com/listings?id=1')).toBe('https://emuready.com')
  })

  it('returns null for invalid URLs', async () => {
    const { getOriginFromUrl } = await loadCors()

    expect(getOriginFromUrl('not a url')).toBeNull()
  })
})

describe('getAllowedOrigins', () => {
  it('allows localhost during CI E2E runs', async () => {
    const { getAllowedOrigins } = await loadCors({
      CI: 'true',
      NODE_ENV: 'test',
    })

    expect(getAllowedOrigins()).toEqual(expect.arrayContaining(['http://localhost:3000']))
  })

  it('allows localhost for test app env even when Next runs a production build', async () => {
    const { getAllowedOrigins } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'test',
    })

    expect(getAllowedOrigins()).toEqual(expect.arrayContaining(['http://localhost:3000']))
  })

  it('uses production origins for explicit production app env', async () => {
    const { getAllowedOrigins } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
    })

    const origins = getAllowedOrigins()
    expect(origins).toEqual(expect.arrayContaining(['https://emuready.com']))
    expect(origins).not.toContain('http://localhost:3000')
  })
})

describe('isAllowedRequestOrigin', () => {
  it('allows configured origins', async () => {
    const { isAllowedRequestOrigin } = await loadCors()

    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://emuready.com/listings',
      }),
    ).toBe(true)
  })

  it('allows request sources when their origin is configured', async () => {
    const { isAllowedRequestOrigin } = await loadCors()

    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://emuready.com/listings/abc',
      }),
    ).toBe(true)
  })

  it('rejects request sources when their origin is not configured', async () => {
    const { isAllowedRequestOrigin } = await loadCors()

    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://preview.example/listings/abc',
      }),
    ).toBe(false)
  })

  it('rejects unconfigured cross-origin requests', async () => {
    const { isAllowedRequestOrigin } = await loadCors()

    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://attacker.example/listings',
      }),
    ).toBe(false)
  })

  it('rejects missing request sources', async () => {
    const { isAllowedRequestOrigin } = await loadCors()

    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: null,
      }),
    ).toBe(false)
  })
})

describe('getCORSHeaders', () => {
  it('allows mobile authentication headers for configured origins', async () => {
    const { getCORSHeaders } = await loadCors({
      ALLOWED_ORIGINS: 'capacitor://localhost',
    })

    const request = new NextRequest('https://emuready.com/api/mobile/trpc/games.get', {
      headers: { origin: 'capacitor://localhost' },
    })
    const headers = getCORSHeaders(request)

    expect(headers['Access-Control-Allow-Origin']).toBe('capacitor://localhost')
    expect(headers['Access-Control-Allow-Headers']).toContain('x-api-key')
    expect(headers['Access-Control-Allow-Headers']).toContain('x-auth-token')
    expect(headers['Access-Control-Allow-Headers']).toContain('x-trpc-source')
    expect(headers['Access-Control-Expose-Headers']).toContain('x-trpc-source')
    expect(headers.Vary).toBe('Origin')
  })

  it('does not echo unconfigured origins', async () => {
    const { getCORSHeaders } = await loadCors({
      ALLOWED_ORIGINS: 'https://emuready.com',
      NEXT_PUBLIC_APP_ENV: 'production',
    })

    const request = new NextRequest('https://emuready.com/api/mobile/trpc/games.get', {
      headers: { origin: 'https://attacker.example' },
    })

    expect(getCORSHeaders(request)['Access-Control-Allow-Origin']).toBe('null')
  })
})
