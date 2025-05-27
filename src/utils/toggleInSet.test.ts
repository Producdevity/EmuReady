import { describe, expect, it } from 'vitest'
import toggleInSet from './toggleInSet'

describe('toggleInSet', () => {
  it('adds an item if not present', () => {
    const set = new Set([1, 2, 3])
    const result = toggleInSet(set, 4)
    expect(result).toEqual(new Set([1, 2, 3, 4]))
  })

  it('removes an item if present', () => {
    const set = new Set([1, 2, 3])
    const result = toggleInSet(set, 2)
    expect(result).toEqual(new Set([1, 3]))
  })

  it('returns a new set instance', () => {
    const set = new Set([1, 2])
    const result = toggleInSet(set, 3)
    expect(result).not.toBe(set)
    expect(result).toEqual(new Set([1, 2, 3]))
  })
})
