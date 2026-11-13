import { beforeEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { prisma } from '@/server/db'
import { notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { VoteEffectsRepository } from './vote-effects.repository'
import { VoteEffectsService } from './vote-effects.service'

const database = vi.hoisted(() => ({
  vote: { count: vi.fn() },
  pcListingVote: { count: vi.fn() },
}))

vi.mock('@/server/db', () => ({ prisma: database }))
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
    vi.clearAllMocks()
    database.vote.count.mockResolvedValue(listingType === 'handheld' ? 1 : 0)
    database.pcListingVote.count.mockResolvedValue(listingType === 'pc' ? 1 : 0)
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
    expect(database.vote.count).not.toHaveBeenCalled()
    expect(database.pcListingVote.count).not.toHaveBeenCalled()
  })

  it('tracks removal without sending a vote notification', async () => {
    await service.afterCommit({ ...base, voteId: null, action: 'deleted', previousValue: true })
    expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
    expect(analytics.engagement.vote).toHaveBeenCalledExactlyOnceWith({
      listingId: base.listingId,
      voteValue: null,
      previousVote: true,
    })
    expect(database.vote.count).not.toHaveBeenCalled()
  })

  it('counts both report types before recording a first vote', async () => {
    database.vote.count.mockResolvedValue(1)
    database.pcListingVote.count.mockResolvedValue(1)
    await service.afterCommit({ ...base, action: 'created', previousValue: null })
    expect(database.vote.count).toHaveBeenCalledWith({ where: { userId: base.userId } })
    expect(database.pcListingVote.count).toHaveBeenCalledWith({ where: { userId: base.userId } })
    expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
  })
})
