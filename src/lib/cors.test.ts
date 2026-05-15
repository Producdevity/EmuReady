import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAllowedOrigins, getOriginFromUrl, isAllowedRequestOrigin } from './cors'

const allowedOrigins = ['https://emuready.com', 'capacitor://localhost']

describe('getOriginFromUrl', () => {
  it('normalizes full URLs to their origin', () => {
    expect(getOriginFromUrl('https://emuready.com/listings?id=1')).toBe('https://emuready.com')
  })

  it('returns null for invalid URLs', () => {
    expect(getOriginFromUrl('not a url')).toBeNull()
  })
})

describe('getAllowedOrigins', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows localhost during CI E2E runs', () => {
    vi.stubEnv('CI', 'true')
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_ALLOWED_ORIGINS', '')
    vi.stubEnv('ALLOWED_ORIGINS', '')

    expect(getAllowedOrigins()).toEqual(expect.arrayContaining(['http://localhost:3000']))
  })
})

describe('isAllowedRequestOrigin', () => {
  it('allows configured origins', () => {
    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://emuready.com/listings',
      }),
    ).toBe(true)
  })

  it('allows request sources when their origin is configured', () => {
    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://emuready.com/listings/abc',
      }),
    ).toBe(true)
  })

  it('rejects request sources when their origin is not configured', () => {
    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://preview.example/listings/abc',
      }),
    ).toBe(false)
  })

  it('rejects unconfigured cross-origin requests', () => {
    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: 'https://attacker.example/listings',
      }),
    ).toBe(false)
  })

  it('rejects missing request sources', () => {
    expect(
      isAllowedRequestOrigin({
        allowedOrigins,
        source: null,
      }),
    ).toBe(false)
  })
})
