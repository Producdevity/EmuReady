import { describe, expect, it } from 'vitest'
import { hasActiveBans } from './user-bans'

describe('hasActiveBans', () => {
  it('returns false for null', () => {
    expect(hasActiveBans(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(hasActiveBans(undefined)).toBe(false)
  })

  it('returns false for a primitive', () => {
    expect(hasActiveBans('user-id')).toBe(false)
    expect(hasActiveBans(42)).toBe(false)
  })

  it('returns false when `userBans` is not a property', () => {
    expect(hasActiveBans({})).toBe(false)
    expect(hasActiveBans({ id: 'x', name: 'y' })).toBe(false)
  })

  it('returns false when `userBans` is null', () => {
    expect(hasActiveBans({ userBans: null })).toBe(false)
  })

  it('returns false when `userBans` is not an array', () => {
    expect(hasActiveBans({ userBans: 'not-an-array' })).toBe(false)
    expect(hasActiveBans({ userBans: { id: 'x' } })).toBe(false)
  })

  it('returns false when `userBans` is an empty array', () => {
    expect(hasActiveBans({ userBans: [] })).toBe(false)
  })

  it('returns true when `userBans` contains at least one entry', () => {
    expect(hasActiveBans({ userBans: [{ id: 'ban-1' }] })).toBe(true)
    expect(hasActiveBans({ userBans: [{ id: 'a' }, { id: 'b' }] })).toBe(true)
  })
})
