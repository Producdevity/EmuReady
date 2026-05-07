import { describe, expect, it } from 'vitest'
import { ApprovalStatus } from '@orm'
import {
  assembleModeratorInfo,
  computeVoteCounts,
  type ModeratorInfoListing,
  type VoteForCounting,
} from './moderator-info'

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

describe('assembleModeratorInfo', () => {
  const baseListing: ModeratorInfoListing = {
    status: ApprovalStatus.APPROVED,
    processedAt: new Date('2026-04-01T10:00:00Z'),
    processedNotes: 'Looks good',
    processedByUser: { id: 'admin-1', name: 'Admin One' },
  }

  it('maps the listing into an approval shape with processedBy renamed', () => {
    const result = assembleModeratorInfo(baseListing, [])
    expect(result.approval).toEqual({
      status: ApprovalStatus.APPROVED,
      processedAt: baseListing.processedAt,
      processedNotes: 'Looks good',
      processedBy: { id: 'admin-1', name: 'Admin One' },
    })
  })

  it('passes the votes array through unchanged', () => {
    const votes = [vote(true), vote(false), vote(true, new Date('2026-01-01'))]
    const result = assembleModeratorInfo(baseListing, votes)
    expect(result.votes).toBe(votes)
  })

  it('computes voteCounts from the supplied votes', () => {
    const votes = [vote(true), vote(true), vote(false), vote(true, new Date('2026-01-01'))]
    const result = assembleModeratorInfo(baseListing, votes)
    expect(result.voteCounts).toEqual({ up: 2, down: 1, nullified: 1 })
  })

  it('preserves null processedAt / processedNotes / processedByUser', () => {
    const result = assembleModeratorInfo(
      {
        status: ApprovalStatus.PENDING,
        processedAt: null,
        processedNotes: null,
        processedByUser: null,
      },
      [],
    )
    expect(result.approval.processedAt).toBeNull()
    expect(result.approval.processedNotes).toBeNull()
    expect(result.approval.processedBy).toBeNull()
    expect(result.voteCounts).toEqual({ up: 0, down: 0, nullified: 0 })
  })

  it('preserves the input vote shape via generic', () => {
    interface RichVote extends VoteForCounting {
      id: string
      createdAt: Date
    }
    const votes: RichVote[] = [
      { id: 'v1', value: true, nullifiedAt: null, createdAt: new Date('2026-01-01') },
      { id: 'v2', value: false, nullifiedAt: null, createdAt: new Date('2026-01-02') },
    ]
    const result = assembleModeratorInfo(baseListing, votes)
    expect(result.votes[0].id).toBe('v1')
    expect(result.votes[0].createdAt).toEqual(new Date('2026-01-01'))
  })
})
