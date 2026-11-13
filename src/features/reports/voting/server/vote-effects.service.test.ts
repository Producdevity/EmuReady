import { beforeEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { prisma } from '@/server/db'
import { notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { TrustAction } from '@orm'
import { VoteEffectsRepository } from './vote-effects.repository'
import { VoteEffectsService } from './vote-effects.service'

const database = vi.hoisted(() => ({
  trustActionLog: { findMany: vi.fn() },
}))

vi.mock('@/server/db', () => ({ prisma: database }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { vote: vi.fn() },
    userJourney: { firstTimeAction: vi.fn() },
  },
}))
vi.mock('@/server/notifications/eventEmitter', () => ({
  NOTIFICATION_EVENTS: { LISTING_VOTED: 'listing.voted' },
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
}))

const service = new VoteEffectsService(new VoteEffectsRepository(prisma))

describe.each(['handheld', 'pc'] as const)('%s committed vote effects', (listingType) => {
  const base = {
    listingType,
    listingId: 'report-1',
    userId: 'voter-1',
    voteId: 'vote-1',
    value: true,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    database.trustActionLog.findMany.mockResolvedValue([{ id: 'first-vote-action' }])
  })

  it('notifies and tracks a new vote using the correct report context', async () => {
    await service.afterCommit({ ...base, action: 'created', previousValue: null })

    expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledExactlyOnceWith({
      eventType: 'listing.voted',
      entityType: listingType === 'handheld' ? 'listing' : 'pcListing',
      entityId: base.listingId,
      triggeredBy: base.userId,
      payload: {
        [listingType === 'handheld' ? 'listingId' : 'pcListingId']: base.listingId,
        voteId: base.voteId,
        voteValue: true,
      },
    })
    expect(analytics.engagement.vote).toHaveBeenCalledExactlyOnceWith({
      listingId: base.listingId,
      voteValue: true,
      previousVote: null,
    })
    expect(analytics.userJourney.firstTimeAction).toHaveBeenCalledExactlyOnceWith({
      userId: base.userId,
      action: 'first_vote',
    })
  })

  it('tracks a changed vote without recounting first-vote progress', async () => {
    await service.afterCommit({ ...base, action: 'updated', previousValue: false })
    expect(analytics.engagement.vote).toHaveBeenCalledWith({
      listingId: base.listingId,
      voteValue: true,
      previousVote: false,
    })
    expect(database.trustActionLog.findMany).not.toHaveBeenCalled()
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('tracks removal without sending a vote notification', async () => {
    await service.afterCommit({ ...base, voteId: null, action: 'deleted', previousValue: true })
    expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
    expect(analytics.engagement.vote).toHaveBeenCalledExactlyOnceWith({
      listingId: base.listingId,
      voteValue: null,
      previousVote: true,
    })
    expect(database.trustActionLog.findMany).not.toHaveBeenCalled()
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('uses retained vote history so removing all votes does not repeat the milestone', async () => {
    database.trustActionLog.findMany.mockResolvedValue([
      { id: 'earlier-vote-action' },
      { id: 'current-vote-action' },
    ])
    await service.afterCommit({ ...base, action: 'created', previousValue: null })
    expect(database.trustActionLog.findMany).toHaveBeenCalledWith({
      where: { userId: base.userId, action: { in: [TrustAction.UPVOTE, TrustAction.DOWNVOTE] } },
      select: { id: true },
      take: 2,
    })
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
  })

  it('does not identify missing vote history as a first vote', async () => {
    database.trustActionLog.findMany.mockResolvedValue([])
    await service.afterCommit({ ...base, action: 'created', previousValue: null })
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
  })

  it('returns the committed result when reading vote history fails', async () => {
    const error = new Error('History unavailable')
    database.trustActionLog.findMany.mockRejectedValue(error)

    await expect(
      service.afterCommit({ ...base, action: 'created', previousValue: null }),
    ).resolves.toBeUndefined()

    expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledOnce()
    expect(analytics.engagement.vote).toHaveBeenCalledOnce()
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Committed vote milestone analytics failed', error)
  })

  it('continues analytics if a notification listener throws', async () => {
    const error = new Error('Listener failed')
    vi.mocked(notificationEventEmitter.emitNotificationEvent).mockImplementation(() => {
      throw error
    })

    await expect(
      service.afterCommit({ ...base, action: 'created', previousValue: null }),
    ).resolves.toBeUndefined()

    expect(analytics.engagement.vote).toHaveBeenCalledOnce()
    expect(analytics.userJourney.firstTimeAction).toHaveBeenCalledOnce()
    expect(logger.error).toHaveBeenCalledWith('Committed vote notification failed', error)
  })

  it('continues milestone tracking if engagement analytics throws', async () => {
    const error = new Error('Analytics failed')
    vi.mocked(analytics.engagement.vote).mockImplementation(() => {
      throw error
    })

    await expect(
      service.afterCommit({ ...base, action: 'created', previousValue: null }),
    ).resolves.toBeUndefined()

    expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledOnce()
    expect(analytics.userJourney.firstTimeAction).toHaveBeenCalledOnce()
    expect(logger.error).toHaveBeenCalledWith('Committed vote analytics failed', error)
  })

  it('returns the committed result if milestone analytics throws', async () => {
    const error = new Error('Milestone failed')
    vi.mocked(analytics.userJourney.firstTimeAction).mockImplementation(() => {
      throw error
    })

    await expect(
      service.afterCommit({ ...base, action: 'created', previousValue: null }),
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledWith('Committed vote milestone analytics failed', error)
  })
})
