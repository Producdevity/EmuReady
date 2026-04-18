import { describe, expect, it, beforeEach, vi } from 'vitest'
import { nullifyUserVotes, restoreUserVotes } from './vote-nullification.service'
import type { PrismaClient } from '@orm'

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/server/services/audit.service', () => ({
  logAudit: vi.fn(),
}))

const mockApplyManualAdjustment = vi.fn()
const mockApplyBulkManualAdjustments = vi.fn()
vi.mock('@/lib/trust/service', () => ({
  TrustService: vi.fn().mockImplementation(() => ({
    applyManualAdjustment: (...args: unknown[]) => mockApplyManualAdjustment(...args),
    applyBulkManualAdjustments: (...args: unknown[]) => mockApplyBulkManualAdjustments(...args),
  })),
}))

vi.mock('@/utils/wilson-score', () => ({
  calculateWilsonScore: (up: number, down: number) => {
    const n = up + down
    if (n === 0) return 0.5
    return up / n
  },
}))

function createMockPrisma() {
  return {
    vote: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    pcListingVote: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    commentVote: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    pcListingCommentVote: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    listing: {
      update: vi.fn().mockResolvedValue({}),
    },
    pcListing: {
      update: vi.fn().mockResolvedValue({}),
    },
    comment: {
      update: vi.fn().mockResolvedValue({}),
    },
    pcListingComment: {
      update: vi.fn().mockResolvedValue({}),
    },
  }
}

const USER_ID = 'user-1'
const ADMIN_ID = 'admin-1'
const AUTHOR_A = 'author-a'
const AUTHOR_B = 'author-b'

function makeHandheldVote(
  overrides: Partial<{
    id: string
    value: boolean
    listingId: string
    authorId: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 'hv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    listingId: overrides.listingId ?? 'listing-1',
    nullifiedAt: null,
    createdAt: new Date('2025-01-01'),
    listing: { authorId: overrides.authorId ?? AUTHOR_A },
  }
}

function makePcVote(
  overrides: Partial<{
    id: string
    value: boolean
    pcListingId: string
    authorId: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 'pv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    pcListingId: overrides.pcListingId ?? 'pc-listing-1',
    nullifiedAt: null,
    createdAt: new Date('2025-01-01'),
    pcListing: { authorId: overrides.authorId ?? AUTHOR_B },
  }
}

function makeCommentVote(
  overrides: Partial<{
    id: string
    value: boolean
    commentId: string
    commentUserId: string
  }> = {},
) {
  return {
    id: overrides.id ?? 'cv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    commentId: overrides.commentId ?? 'comment-1',
    nullifiedAt: null,
    createdAt: new Date('2025-01-01'),
    comment: { userId: overrides.commentUserId ?? AUTHOR_A },
  }
}

function makePcCommentVote(
  overrides: Partial<{
    id: string
    value: boolean
    commentId: string
    commentUserId: string
  }> = {},
) {
  return {
    id: overrides.id ?? 'pcv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    commentId: overrides.commentId ?? 'pc-comment-1',
    nullifiedAt: null,
    createdAt: new Date('2025-01-01'),
    comment: { userId: overrides.commentUserId ?? AUTHOR_B },
  }
}

describe('vote-nullification.service', () => {
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    mockApplyManualAdjustment.mockResolvedValue(undefined)
    mockApplyBulkManualAdjustments.mockResolvedValue(0)
  })

  describe('nullifyUserVotes', () => {
    it('returns zero counts when user has no active votes', async () => {
      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam voting',
        includeCommentVotes: true,
      })

      expect(result).toEqual({
        handheldVotesNullified: 0,
        pcVotesNullified: 0,
        commentVotesNullified: 0,
        pcCommentVotesNullified: 0,
        listingsRecalculated: 0,
        commentsRecalculated: 0,
        trustAdjustments: 0,
      })

      expect(prisma.vote.updateMany).not.toHaveBeenCalled()
      expect(prisma.pcListingVote.updateMany).not.toHaveBeenCalled()
      expect(mockApplyBulkManualAdjustments).not.toHaveBeenCalled()
    })

    it('nullifies handheld votes and sets nullifiedAt', async () => {
      const votes = [
        makeHandheldVote({ id: 'hv-1', value: true }),
        makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_B }),
      ]
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam voting',
        includeCommentVotes: false,
      })

      expect(result.handheldVotesNullified).toBe(2)
      expect(prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['hv-1', 'hv-2'] } },
        data: { nullifiedAt: expect.any(Date) },
      })
    })

    it('nullifies PC votes', async () => {
      const votes = [makePcVote({ id: 'pv-1' }), makePcVote({ id: 'pv-2' })]
      prisma.pcListingVote.findMany.mockResolvedValue(votes)

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam voting',
        includeCommentVotes: false,
      })

      expect(result.pcVotesNullified).toBe(2)
      expect(prisma.pcListingVote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['pv-1', 'pv-2'] } },
        data: { nullifiedAt: expect.any(Date) },
      })
    })

    it('nullifies comment votes when includeCommentVotes is true', async () => {
      const commentVotes = [makeCommentVote({ id: 'cv-1' })]
      const pcCommentVotes = [makePcCommentVote({ id: 'pcv-1' })]
      prisma.commentVote.findMany.mockResolvedValue(commentVotes)
      prisma.pcListingCommentVote.findMany.mockResolvedValue(pcCommentVotes)

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      expect(result.commentVotesNullified).toBe(1)
      expect(result.pcCommentVotesNullified).toBe(1)
      expect(prisma.commentVote.updateMany).toHaveBeenCalled()
      expect(prisma.pcListingCommentVote.updateMany).toHaveBeenCalled()
    })

    it('skips comment votes when includeCommentVotes is false', async () => {
      prisma.vote.findMany.mockResolvedValue([makeHandheldVote()])

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      expect(result.commentVotesNullified).toBe(0)
      expect(result.pcCommentVotesNullified).toBe(0)
      expect(prisma.commentVote.findMany).not.toHaveBeenCalled()
      expect(prisma.pcListingCommentVote.findMany).not.toHaveBeenCalled()
    })

    it('recalculates handheld listing scores with Wilson score', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVote({ id: 'hv-1', listingId: 'listing-1', value: true }),
        makeHandheldVote({ id: 'hv-2', listingId: 'listing-1', value: false }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: {
          upvoteCount: 0,
          downvoteCount: 0,
          voteCount: 0,
          successRate: 0.5, // Wilson score for 0 votes
        },
      })
    })

    it('recalculates PC listing scores', async () => {
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcVote({ id: 'pv-1', pcListingId: 'pc-listing-1', value: true }),
      ])
      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      expect(prisma.pcListing.update).toHaveBeenCalledWith({
        where: { id: 'pc-listing-1' },
        data: {
          upvoteCount: 0,
          downvoteCount: 0,
          voteCount: 0,
          successRate: 0.5,
        },
      })
    })

    it('recalculates handheld comment scores as upvotes minus downvotes', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        makeCommentVote({ id: 'cv-1', commentId: 'comment-1' }),
      ])
      prisma.commentVote.groupBy.mockResolvedValue([
        { commentId: 'comment-1', value: true, _count: { _all: 3 } },
        { commentId: 'comment-1', value: false, _count: { _all: 1 } },
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { score: 2 },
      })
    })

    it('recalculates PC comment scores', async () => {
      prisma.pcListingCommentVote.findMany.mockResolvedValue([
        makePcCommentVote({ id: 'pcv-1', commentId: 'pc-comment-1' }),
      ])
      prisma.pcListingCommentVote.groupBy.mockResolvedValue([
        { commentId: 'pc-comment-1', value: true, _count: { _all: 5 } },
        { commentId: 'pc-comment-1', value: false, _count: { _all: 2 } },
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      expect(prisma.pcListingComment.update).toHaveBeenCalledWith({
        where: { id: 'pc-comment-1' },
        data: { score: 3 },
      })
    })

    it('reverses voter trust for each handheld vote (-1 per vote)', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVote({ id: 'hv-1', value: true }),
        makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_B }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      // Voter should get -1 per handheld vote (total -2)
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(USER_ID)).toBe(-2)
    })

    it('reverses author trust: -2 for upvote, +1 for downvote', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVote({ id: 'hv-1', value: true, authorId: AUTHOR_A }),
        makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_A }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      // Author A: upvote reversed (-2) + downvote reversed (+1) = -1
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(AUTHOR_A)).toBe(-1)
    })

    it('skips author trust reversal for self-votes', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVote({ id: 'hv-1', value: true, authorId: USER_ID }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      // Only the voter trust should be adjusted (not author, since it's a self-vote)
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(USER_ID)).toBe(-1)
      expect(adjustments.size).toBe(1)
    })

    it('reverses trust for PC votes (same as handheld)', async () => {
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcVote({ id: 'pv-1', value: true, authorId: AUTHOR_B }),
        makePcVote({ id: 'pv-2', value: false, authorId: AUTHOR_B }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      // Voter: -1 per vote = -2 total
      expect(adjustments.get(USER_ID)).toBe(-2)
      // Author B: upvote reversed (-2) + downvote reversed (+1) = -1
      expect(adjustments.get(AUTHOR_B)).toBe(-1)
    })

    it('reverses comment author trust for handheld comment upvotes/downvotes', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        makeCommentVote({ id: 'cv-1', value: true, commentUserId: AUTHOR_A }),
        makeCommentVote({ id: 'cv-2', value: false, commentUserId: AUTHOR_A }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      // Author A comment trust: upvote reversed (-2) + downvote reversed (+1) = -1
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(AUTHOR_A)).toBe(-1)
    })

    it('skips comment author trust for self-votes on own comments', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        makeCommentVote({ id: 'cv-1', value: true, commentUserId: USER_ID }),
      ])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      // No trust adjustment for comment self-votes — map is empty
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.size).toBe(0)
    })

    it('propagates trust adjustment errors for transactional rollback', async () => {
      prisma.vote.findMany.mockResolvedValue([makeHandheldVote({ id: 'hv-1', value: true })])
      mockApplyBulkManualAdjustments.mockRejectedValue(new Error('Trust service down'))

      await expect(
        nullifyUserVotes(prisma as unknown as PrismaClient, {
          userId: USER_ID,
          adminUserId: ADMIN_ID,
          reason: 'Spam',
          includeCommentVotes: false,
        }),
      ).rejects.toThrow('Trust service down')
    })

    it('batches nullification for more than 100 votes', async () => {
      const votes = Array.from({ length: 150 }, (_, i) =>
        makeHandheldVote({ id: `hv-${i}`, listingId: `listing-${i % 5}` }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Mass spam',
        includeCommentVotes: false,
      })

      // 150 votes should result in 2 batch calls (100 + 50)
      expect(prisma.vote.updateMany).toHaveBeenCalledTimes(2)
      const firstBatch = prisma.vote.updateMany.mock.calls[0][0]
      const secondBatch = prisma.vote.updateMany.mock.calls[1][0]
      expect(firstBatch.where.id.in).toHaveLength(100)
      expect(secondBatch.where.id.in).toHaveLength(50)
    })

    it('recalculates each affected listing only once', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVote({ id: 'hv-1', listingId: 'listing-1' }),
        makeHandheldVote({ id: 'hv-2', listingId: 'listing-1' }),
        makeHandheldVote({ id: 'hv-3', listingId: 'listing-2' }),
      ])

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      expect(result.listingsRecalculated).toBe(2)
      expect(prisma.listing.update).toHaveBeenCalledTimes(2)
    })

    it('logs audit with correct metadata', async () => {
      const { logAudit } = await import('@/server/services/audit.service')
      prisma.vote.findMany.mockResolvedValue([makeHandheldVote()])
      prisma.pcListingVote.findMany.mockResolvedValue([makePcVote()])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam voting',
        includeCommentVotes: false,
      })

      expect(logAudit).toHaveBeenCalledTimes(1)
      const auditCall = vi.mocked(logAudit).mock.calls[0]
      expect(auditCall[0]).toBe(prisma)
      expect(auditCall[1]).toMatchObject({
        actorId: ADMIN_ID,
        targetUserId: USER_ID,
        metadata: expect.objectContaining({
          reason: 'Spam voting',
          handheldVotes: 1,
          pcVotes: 1,
        }),
      })
    })

    it('handles mixed vote types across handheld and PC with comment votes', async () => {
      prisma.vote.findMany.mockResolvedValue([makeHandheldVote({ id: 'hv-1', value: true })])
      prisma.pcListingVote.findMany.mockResolvedValue([makePcVote({ id: 'pv-1', value: false })])
      prisma.commentVote.findMany.mockResolvedValue([makeCommentVote({ id: 'cv-1', value: true })])
      prisma.pcListingCommentVote.findMany.mockResolvedValue([
        makePcCommentVote({ id: 'pcv-1', value: false }),
      ])

      const result = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      expect(result.handheldVotesNullified).toBe(1)
      expect(result.pcVotesNullified).toBe(1)
      expect(result.commentVotesNullified).toBe(1)
      expect(result.pcCommentVotesNullified).toBe(1)
      expect(result.listingsRecalculated).toBe(2)
      expect(result.commentsRecalculated).toBe(2)
    })
  })

  describe('restoreUserVotes', () => {
    it('returns zero counts when user has no nullified votes', async () => {
      const result = await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(result).toEqual({
        handheldVotesRestored: 0,
        pcVotesRestored: 0,
        commentVotesRestored: 0,
        pcCommentVotesRestored: 0,
        listingsRecalculated: 0,
        commentsRecalculated: 0,
        trustAdjustments: 0,
      })
      expect(prisma.vote.updateMany).not.toHaveBeenCalled()
    })

    it('clears nullifiedAt on handheld votes', async () => {
      const nullifiedVotes = [
        { ...makeHandheldVote({ id: 'hv-1' }), nullifiedAt: new Date() },
        { ...makeHandheldVote({ id: 'hv-2' }), nullifiedAt: new Date() },
      ]
      prisma.vote.findMany.mockResolvedValue(nullifiedVotes)

      const result = await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(result.handheldVotesRestored).toBe(2)
      expect(prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['hv-1', 'hv-2'] } },
        data: { nullifiedAt: null },
      })
    })

    it('clears nullifiedAt on PC votes', async () => {
      const nullifiedVotes = [{ ...makePcVote({ id: 'pv-1' }), nullifiedAt: new Date() }]
      prisma.pcListingVote.findMany.mockResolvedValue(nullifiedVotes)

      const result = await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(result.pcVotesRestored).toBe(1)
      expect(prisma.pcListingVote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['pv-1'] } },
        data: { nullifiedAt: null },
      })
    })

    it('restores comment votes for both handheld and PC', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        { ...makeCommentVote({ id: 'cv-1' }), nullifiedAt: new Date() },
      ])
      prisma.pcListingCommentVote.findMany.mockResolvedValue([
        { ...makePcCommentVote({ id: 'pcv-1' }), nullifiedAt: new Date() },
      ])

      const result = await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(result.commentVotesRestored).toBe(1)
      expect(result.pcCommentVotesRestored).toBe(1)
    })

    it('recalculates listing scores after restoration', async () => {
      prisma.vote.findMany.mockResolvedValue([
        {
          ...makeHandheldVote({ id: 'hv-1', listingId: 'listing-1', value: true }),
          nullifiedAt: new Date(),
        },
      ])
      prisma.vote.groupBy.mockResolvedValue([
        { listingId: 'listing-1', value: true, _count: { _all: 5 } },
        { listingId: 'listing-1', value: false, _count: { _all: 2 } },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: {
          upvoteCount: 5,
          downvoteCount: 2,
          voteCount: 7,
          successRate: expect.any(Number),
        },
      })
    })

    it('recalculates comment scores after restoration', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        { ...makeCommentVote({ id: 'cv-1', commentId: 'comment-1' }), nullifiedAt: new Date() },
      ])
      prisma.commentVote.groupBy.mockResolvedValue([
        { commentId: 'comment-1', value: true, _count: { _all: 4 } },
        { commentId: 'comment-1', value: false, _count: { _all: 1 } },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { score: 3 },
      })
    })

    it('re-applies voter trust for each handheld vote (+1 per vote)', async () => {
      prisma.vote.findMany.mockResolvedValue([
        { ...makeHandheldVote({ id: 'hv-1', value: true }), nullifiedAt: new Date() },
        {
          ...makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_B }),
          nullifiedAt: new Date(),
        },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      // Voter should get +1 per handheld vote (total +2)
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(USER_ID)).toBe(2)
    })

    it('re-applies author trust: +2 for upvotes, -1 for downvotes', async () => {
      prisma.vote.findMany.mockResolvedValue([
        {
          ...makeHandheldVote({ id: 'hv-1', value: true, authorId: AUTHOR_A }),
          nullifiedAt: new Date(),
        },
        {
          ...makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_A }),
          nullifiedAt: new Date(),
        },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      // Author A: upvote re-applied (+2) + downvote re-applied (-1) = +1
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(AUTHOR_A)).toBe(1)
    })

    it('skips author trust re-application for self-votes', async () => {
      prisma.vote.findMany.mockResolvedValue([
        {
          ...makeHandheldVote({ id: 'hv-1', value: true, authorId: USER_ID }),
          nullifiedAt: new Date(),
        },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      expect(adjustments.get(USER_ID)).toBe(1)
      expect(adjustments.size).toBe(1)
    })

    it('re-applies trust for PC votes (same as handheld)', async () => {
      prisma.pcListingVote.findMany.mockResolvedValue([
        { ...makePcVote({ id: 'pv-1', value: true, authorId: AUTHOR_B }), nullifiedAt: new Date() },
        {
          ...makePcVote({ id: 'pv-2', value: false, authorId: AUTHOR_B }),
          nullifiedAt: new Date(),
        },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      // Voter: +1 per vote = +2 total
      expect(adjustments.get(USER_ID)).toBe(2)
      // Author B: upvote re-applied (+2) + downvote re-applied (-1) = +1
      expect(adjustments.get(AUTHOR_B)).toBe(1)
    })

    it('batches restoration for more than 100 votes', async () => {
      const votes = Array.from({ length: 120 }, (_, i) => ({
        ...makeHandheldVote({ id: `hv-${i}`, listingId: `listing-${i % 3}` }),
        nullifiedAt: new Date(),
      }))
      prisma.vote.findMany.mockResolvedValue(votes)

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(prisma.vote.updateMany).toHaveBeenCalledTimes(2)
      const firstBatch = prisma.vote.updateMany.mock.calls[0][0]
      const secondBatch = prisma.vote.updateMany.mock.calls[1][0]
      expect(firstBatch.where.id.in).toHaveLength(100)
      expect(secondBatch.where.id.in).toHaveLength(20)
    })

    it('logs audit with correct metadata', async () => {
      const { logAudit } = await import('@/server/services/audit.service')
      prisma.vote.findMany.mockResolvedValue([{ ...makeHandheldVote(), nullifiedAt: new Date() }])
      prisma.pcListingVote.findMany.mockResolvedValue([
        { ...makePcVote(), nullifiedAt: new Date() },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban reversed',
      })

      expect(logAudit).toHaveBeenCalledTimes(1)
      const auditCall = vi.mocked(logAudit).mock.calls[0]
      expect(auditCall[0]).toBe(prisma)
      expect(auditCall[1]).toMatchObject({
        actorId: ADMIN_ID,
        targetUserId: USER_ID,
        metadata: expect.objectContaining({
          reason: 'Wrongful ban reversed',
          handheldVotes: 1,
          pcVotes: 1,
        }),
      })
    })

    it('re-applies comment author trust for handheld comment votes', async () => {
      prisma.commentVote.findMany.mockResolvedValue([
        {
          ...makeCommentVote({ id: 'cv-1', value: true, commentUserId: AUTHOR_A }),
          nullifiedAt: new Date(),
        },
        {
          ...makeCommentVote({ id: 'cv-2', value: false, commentUserId: AUTHOR_B }),
          nullifiedAt: new Date(),
        },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Wrongful ban',
      })

      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const { adjustments } = mockApplyBulkManualAdjustments.mock.calls[0][0] as {
        adjustments: Map<string, number>
      }
      // Author A: upvote re-applied (+2)
      expect(adjustments.get(AUTHOR_A)).toBe(2)
      // Author B: downvote re-applied (-1)
      expect(adjustments.get(AUTHOR_B)).toBe(-1)
    })
  })

  describe('nullify → restore round-trip', () => {
    it('nullify then restore results in net-zero trust adjustments', async () => {
      const votes = [
        makeHandheldVote({ id: 'hv-1', value: true, authorId: AUTHOR_A }),
        makeHandheldVote({ id: 'hv-2', value: false, authorId: AUTHOR_B }),
      ]
      const commentVotes = [makeCommentVote({ id: 'cv-1', value: true, commentUserId: AUTHOR_A })]

      // Phase 1: Nullify
      prisma.vote.findMany.mockResolvedValue(votes)
      prisma.commentVote.findMany.mockResolvedValue(commentVotes)

      const nullifyResult = await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: true,
      })

      expect(nullifyResult.handheldVotesNullified).toBe(2)
      expect(nullifyResult.commentVotesNullified).toBe(1)

      // Capture nullification trust adjustments
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const nullifyAdjustments = mockApplyBulkManualAdjustments.mock.calls[0][0].adjustments as Map<
        string,
        number
      >

      // Phase 2: Restore
      mockApplyBulkManualAdjustments.mockClear()
      mockApplyBulkManualAdjustments.mockResolvedValue(0)
      prisma = createMockPrisma()

      const nullifiedVotes = votes.map((v) => ({ ...v, nullifiedAt: new Date() }))
      const nullifiedCommentVotes = commentVotes.map((v) => ({ ...v, nullifiedAt: new Date() }))

      prisma.vote.findMany.mockResolvedValue(nullifiedVotes)
      prisma.commentVote.findMany.mockResolvedValue(nullifiedCommentVotes)

      const restoreResult = await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Ban lifted',
      })

      expect(restoreResult.handheldVotesRestored).toBe(2)
      expect(restoreResult.commentVotesRestored).toBe(1)

      // Capture restoration trust adjustments
      expect(mockApplyBulkManualAdjustments).toHaveBeenCalledTimes(1)
      const restoreAdjustments = mockApplyBulkManualAdjustments.mock.calls[0][0].adjustments as Map<
        string,
        number
      >

      // Net trust adjustment for each user should be zero
      for (const [uid, nullifyAdj] of nullifyAdjustments) {
        const restoreAdj = restoreAdjustments.get(uid) ?? 0
        expect(nullifyAdj + restoreAdj).toBe(0)
      }
    })

    it('restore after nullify clears nullifiedAt and recalculates scores', async () => {
      const vote = makeHandheldVote({ id: 'hv-1', listingId: 'listing-1', value: true })

      // Phase 1: Nullify
      prisma.vote.findMany.mockResolvedValue([vote])

      await nullifyUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Spam',
        includeCommentVotes: false,
      })

      // Verify nullification set nullifiedAt
      expect(prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['hv-1'] } },
        data: { nullifiedAt: expect.any(Date) },
      })

      // Phase 2: Restore
      prisma = createMockPrisma()
      prisma.vote.findMany.mockResolvedValue([{ ...vote, nullifiedAt: new Date() }])
      prisma.vote.groupBy.mockResolvedValue([
        { listingId: 'listing-1', value: true, _count: { _all: 1 } },
      ])

      await restoreUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        adminUserId: ADMIN_ID,
        reason: 'Ban lifted',
      })

      // Verify restoration cleared nullifiedAt
      expect(prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['hv-1'] } },
        data: { nullifiedAt: null },
      })

      // Verify listing was recalculated with restored vote
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: {
          upvoteCount: 1,
          downvoteCount: 0,
          voteCount: 1,
          successRate: 1,
        },
      })
    })
  })
})
