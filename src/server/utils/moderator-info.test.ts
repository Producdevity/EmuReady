import { describe, expect, it } from 'vitest'
import { computeVoteCounts, type VoteForCounting } from './moderator-info'

function vote(value: boolean, nullifiedAt: Date | null = null): VoteForCounting {
  return { value, nullifiedAt }
}

describe('computeVoteCounts', () => {
  it('returns zeroes for an empty array', () => {
    expect(computeVoteCounts([])).toEqual({ up: 0, down: 0, nullified: 0 })
  })

  it('counts only active upvotes in `up`', () => {
    const result = computeVoteCounts([vote(true), vote(true), vote(true)])
    expect(result).toEqual({ up: 3, down: 0, nullified: 0 })
  })

  it('counts only active downvotes in `down`', () => {
    const result = computeVoteCounts([vote(false), vote(false)])
    expect(result).toEqual({ up: 0, down: 2, nullified: 0 })
  })

  it('counts nullified votes separately, regardless of value', () => {
    const result = computeVoteCounts([
      vote(true, new Date('2026-01-01')),
      vote(false, new Date('2026-01-02')),
      vote(true, new Date('2026-01-03')),
    ])
    expect(result).toEqual({ up: 0, down: 0, nullified: 3 })
  })

  it('returns the correct mix when active and nullified votes are interleaved', () => {
    const result = computeVoteCounts([
      vote(true), // up
      vote(true, new Date()), // nullified
      vote(false), // down
      vote(false, new Date()), // nullified
      vote(true), // up
      vote(true), // up
      vote(false), // down
    ])
    expect(result).toEqual({ up: 3, down: 2, nullified: 2 })
  })

  it('does NOT double-count: a nullified upvote contributes only to `nullified`', () => {
    const result = computeVoteCounts([vote(true, new Date('2026-01-01'))])
    expect(result.up).toBe(0)
    expect(result.down).toBe(0)
    expect(result.nullified).toBe(1)
  })
})
