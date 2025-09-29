import { describe, it, expect, vi } from 'vitest'
import { oauthState } from './oauthState.service'

describe('oauthState', () => {
  it('signs and verifies tokens', () => {
    vi.stubEnv('INTERNAL_API_KEY', 'test-secret-Key-123')
    const token = oauthState.sign('user-123', 2)
    const payload = oauthState.verify(token)
    expect(payload.sub).toBe('user-123')
    expect(payload.exp).toBeGreaterThan(payload.iat)
  })

  it('rejects expired tokens', async () => {
    vi.stubEnv('INTERNAL_API_KEY', 'test-secret-Key-123')
    const token = oauthState.sign('user-123', -1)
    expect(() => oauthState.verify(token)).toThrow()
  })
})
