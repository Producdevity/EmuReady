import { describe, it, expect } from 'vitest'
import { hasPaidOnce } from './patreon.service'

describe('patreon.hasPaidOnce', () => {
  it('returns true when membership has lifetime_support_cents > 0', () => {
    const identity = {
      included: [{ type: 'member', attributes: { lifetime_support_cents: 100 } }],
    }
    expect(hasPaidOnce(identity)).toBe(true)
  })

  it('returns false when no paid charges', () => {
    const identity = { included: [{ type: 'member', attributes: { lifetime_support_cents: 0 } }] }
    expect(hasPaidOnce(identity)).toBe(false)
  })
})
