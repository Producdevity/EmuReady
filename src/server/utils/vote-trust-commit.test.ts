import { beforeEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { prisma } from '@/server/db'
import { ApprovalStatus, Role, type Prisma } from '@orm/client'
import { commentsRouter as handheldComments } from '../api/routers/listings/comments'
import { coreRouter as handheldReports } from '../api/routers/listings/core'
import { mobileListingsRouter as mobileReports } from '../api/routers/mobile/listings'
import { commentsRouter as pcComments } from '../api/routers/pcListings/comments'
import { coreRouter as pcReports } from '../api/routers/pcListings/core'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: { findUnique: vi.fn(), update: vi.fn() },
  listing: { findUnique: vi.fn() },
  pcListing: { findUnique: vi.fn() },
  vote: { findUnique: vi.fn(), create: vi.fn() },
  pcListingVote: { findUnique: vi.fn(), create: vi.fn() },
  comment: { findUnique: vi.fn(), update: vi.fn() },
  pcListingComment: { findUnique: vi.fn(), update: vi.fn() },
  commentVote: { findUnique: vi.fn(), create: vi.fn() },
  pcListingCommentVote: { findUnique: vi.fn(), create: vi.fn() },
  trustActionLog: { create: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))
vi.mock('@/lib/analytics', () => ({
  default: {
    trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() },
    engagement: { commentVote: vi.fn(), vote: vi.fn() },
  },
}))
vi.mock('@/server/utils/query-builders', () => ({ isUserBanned: vi.fn().mockResolvedValue(false) }))
vi.mock('@/server/utils/vote-counts', () => ({
  updateListingVoteCounts: vi.fn(),
  updatePcListingVoteCounts: vi.fn(),
}))
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: { COMMENT_VOTED: 'COMMENT_VOTED' },
}))
vi.mock('@/features/reports/voting/server/vote-effects.service', () => ({
  VoteEffectsService: class {
    async afterCommit() {
      return undefined
    }
  },
}))

const voterId = '00000000-0000-4000-a000-000000000001'
const authorId = '00000000-0000-4000-a000-000000000002'
const reportId = '00000000-0000-4000-a000-000000000010'
const commentId = '00000000-0000-4000-a000-000000000020'
const context = {
  prisma,
  apiKey: null,
  session: {
    user: {
      id: voterId,
      name: 'Voter',
      email: 'voter@example.com',
      role: Role.USER,
      permissions: [],
      showNsfw: false,
    },
  },
  headers: new Headers(),
}
const cases = [
  {
    name: 'handheld report',
    request: () => handheldReports.createCaller(context).vote({ listingId: reportId, value: true }),
  },
  {
    name: 'PC report',
    request: () => pcReports.createCaller(context).vote({ pcListingId: reportId, value: true }),
  },
  {
    name: 'mobile report',
    request: () => mobileReports.createCaller(context).vote({ listingId: reportId, value: true }),
  },
  {
    name: 'handheld comment',
    request: () => handheldComments.createCaller(context).vote({ commentId, value: true }),
  },
  {
    name: 'PC comment',
    request: () => pcComments.createCaller(context).vote({ commentId, value: true }),
  },
  {
    name: 'mobile comment',
    request: () => mobileReports.createCaller(context).voteComment({ commentId, value: true }),
  },
]
let commit = Promise.withResolvers<void>()
let rejectCommit = false
beforeEach(() => {
  vi.clearAllMocks()
  commit = Promise.withResolvers<void>()
  rejectCommit = false
  const scores = new Map<string, number>()
  database.$transaction.mockImplementation(
    async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
      const result = await operation(prisma)
      await commit.promise
      if (rejectCommit) throw new Error('commit failed')
      return result
    },
  )
  database.user.findUnique.mockResolvedValue({ id: voterId })
  database.user.update.mockImplementation(async (input: Prisma.UserUpdateArgs) => {
    const id = input.where.id
    const score = input.data.trustScore
    if (!id || typeof score !== 'object' || typeof score.increment !== 'number')
      throw new Error('Expected atomic score increment')
    const trustScore = (scores.get(id) ?? 100) + score.increment
    scores.set(id, trustScore)
    return { trustScore }
  })
  const report = { id: reportId, authorId, status: ApprovalStatus.APPROVED }
  database.listing.findUnique.mockResolvedValue(report)
  database.pcListing.findUnique.mockResolvedValue(report)
  const comment = {
    id: commentId,
    userId: authorId,
    listingId: reportId,
    pcListingId: reportId,
    score: 0,
  }
  database.comment.findUnique.mockResolvedValue(comment)
  database.pcListingComment.findUnique.mockResolvedValue(comment)
  database.comment.update.mockResolvedValue({ ...comment, score: 1 })
  database.pcListingComment.update.mockResolvedValue({ ...comment, score: 1 })
  for (const model of [
    database.vote,
    database.pcListingVote,
    database.commentVote,
    database.pcListingCommentVote,
  ]) {
    model.findUnique.mockResolvedValue(null)
    model.create.mockResolvedValue({
      id: 'vote-1',
      userId: voterId,
      listingId: reportId,
      pcListingId: reportId,
      commentId,
      value: true,
    })
  }
  database.trustActionLog.create.mockResolvedValue({})
})

describe.each(cases)('$name trust transaction', (entry) => {
  it.each(['commit', 'rollback'] as const)(
    'defers trust analytics through a transaction %s',
    async (outcome) => {
      rejectCommit = outcome === 'rollback'
      const pending = entry.request().then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      )
      try {
        await vi.waitFor(() => expect(database.trustActionLog.create).toHaveBeenCalled())
        expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
        expect(database.$transaction).toHaveBeenCalledOnce()
      } finally {
        commit.resolve()
      }
      const result = await pending
      if (outcome === 'rollback') {
        expect(result).toMatchObject({ ok: false, error: { message: 'commit failed' } })
        expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
        expect(analytics.trust.trustLevelChanged).not.toHaveBeenCalled()
      } else {
        if (!result.ok) throw result.error
        expect(analytics.trust.trustScoreChanged).toHaveBeenCalled()
        expect(result.value).not.toHaveProperty('trustChanges')
        expect(result.value).not.toHaveProperty('changes')
      }
    },
  )
})
