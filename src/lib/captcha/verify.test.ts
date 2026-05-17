import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('captcha config', () => {
  it('enables client captcha when only the public site key is available', async () => {
    vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'site-key')
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '')
    vi.resetModules()

    const { isCaptchaClientEnabled, isCaptchaVerificationEnabled } = await import('./config')

    expect(isCaptchaClientEnabled()).toBe(true)
    expect(isCaptchaVerificationEnabled()).toBe(false)
  })
})

describe('verifyRecaptcha', () => {
  it('skips verification when no server secret is configured', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '')
    vi.resetModules()

    const { verifyRecaptcha } = await import('./verify')
    const result = await verifyRecaptcha({
      token: null,
      expectedAction: 'create_listing',
    })

    expect(result).toEqual({
      success: true,
      score: 1,
      action: 'create_listing',
    })
    expect(warnSpy).toHaveBeenCalledWith('CAPTCHA is disabled - skipping verification')
  })

  it('rejects a missing token when server verification is configured', async () => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', 'secret-key')
    vi.resetModules()

    const { verifyRecaptcha } = await import('./verify')
    const result = await verifyRecaptcha({
      token: null,
      expectedAction: 'create_listing',
    })

    expect(result).toEqual({
      success: false,
      score: 0,
      action: 'create_listing',
      error: 'Missing reCAPTCHA token',
    })
  })

  it('sends the token to Google and accepts matching high-score responses', async () => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', 'secret-key')
    vi.resetModules()

    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          score: 0.9,
          action: 'create_listing',
          challenge_ts: '2026-05-16T00:00:00Z',
          hostname: 'localhost',
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { verifyRecaptcha } = await import('./verify')
    const result = await verifyRecaptcha({
      token: 'token',
      expectedAction: 'create_listing',
      userIP: '127.0.0.1',
    })

    expect(result).toEqual({
      success: true,
      score: 0.9,
      action: 'create_listing',
    })

    const firstCall = fetchMock.mock.calls[0]
    if (!firstCall) throw new Error('Expected reCAPTCHA verification request')

    expect(firstCall[0]).toBe('https://www.google.com/recaptcha/api/siteverify')
    const requestInit = firstCall[1]
    if (!requestInit) throw new Error('Expected request init')

    expect(requestInit.method).toBe('POST')
    const body = requestInit.body
    if (!(body instanceof URLSearchParams)) throw new Error('Expected URLSearchParams body')

    expect(body.get('secret')).toBe('secret-key')
    expect(body.get('response')).toBe('token')
    expect(body.get('remoteip')).toBe('127.0.0.1')
  })
})
