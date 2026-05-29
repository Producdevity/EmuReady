import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRequestIp, isTurnstileConfigured, verifyTurnstileToken } from './turnstile'
import { HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

const originalFetch = global.fetch

afterEach(() => {
  vi.unstubAllEnvs()
  global.fetch = originalFetch
})

describe('turnstile provider', () => {
  it('reports whether Turnstile is configured', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    expect(isTurnstileConfigured()).toBe(false)

    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    expect(isTurnstileConfigured()).toBe(false)

    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key')
    expect(isTurnstileConfigured()).toBe(false)

    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    expect(isTurnstileConfigured()).toBe(true)
  })

  it('prefers Cloudflare connecting IP over forwarded headers', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.10',
      'x-forwarded-for': '198.51.100.1, 198.51.100.2',
      'x-real-ip': '192.0.2.1',
    })

    expect(getRequestIp(headers)).toBe('203.0.113.10')
  })

  it('validates a Turnstile token with Siteverify', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: true, action: HUMAN_VERIFICATION_ACTION })),
    )

    await expect(
      verifyTurnstileToken({
        token: 'token',
        remoteIp: '203.0.113.10',
      }),
    ).resolves.toEqual({ success: true, errorCodes: [] })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('rejects tokens issued for a different action', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: true, action: 'login' })),
    )

    await expect(verifyTurnstileToken({ token: 'token' })).resolves.toEqual({
      success: false,
      errorCodes: ['action-mismatch'],
    })
  })

  it('returns provider error codes for invalid tokens', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
            'error-codes': ['timeout-or-duplicate'],
          }),
        ),
    )

    await expect(verifyTurnstileToken({ token: 'expired' })).resolves.toEqual({
      success: false,
      errorCodes: ['timeout-or-duplicate'],
    })
  })

  it('fails closed when Siteverify times out', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    global.fetch = vi.fn(async () => {
      throw new DOMException('Timed out', 'TimeoutError')
    })

    await expect(verifyTurnstileToken({ token: 'token' })).resolves.toEqual({
      success: false,
      errorCodes: ['siteverify-timeout'],
    })
  })

  it('fails closed when Siteverify cannot be reached', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    global.fetch = vi.fn(async () => {
      throw new Error('network unavailable')
    })

    await expect(verifyTurnstileToken({ token: 'token' })).resolves.toEqual({
      success: false,
      errorCodes: ['siteverify-request-failed'],
    })
  })
})
