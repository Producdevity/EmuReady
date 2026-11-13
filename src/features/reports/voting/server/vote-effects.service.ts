import analytics from '@/lib/analytics'
import { type ListingType } from '@/schemas/common'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { type VoteEffectsRepository } from './vote-effects.repository'

interface Input {
  listingId: string
  listingType: ListingType
  userId: string
  action: 'created' | 'updated' | 'deleted'
  voteId: string | null
  value: boolean
  previousValue: boolean | null
}

export class VoteEffectsService {
  constructor(private readonly repository: VoteEffectsRepository) {}

  async afterCommit(input: Input): Promise<void> {
    if (input.action !== 'deleted' && input.voteId) {
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_VOTED,
        entityType: input.listingType === 'handheld' ? 'listing' : 'pcListing',
        entityId: input.listingId,
        triggeredBy: input.userId,
        payload: {
          ...(input.listingType === 'handheld'
            ? { listingId: input.listingId }
            : { pcListingId: input.listingId }),
          voteId: input.voteId,
          voteValue: input.value,
        },
      })
    }

    analytics.engagement.vote({
      listingId: input.listingId,
      voteValue: input.action === 'deleted' ? null : input.value,
      previousVote: input.previousValue,
    })

    if (input.action === 'created' && (await this.repository.countUserVotes(input.userId)) === 1) {
      analytics.userJourney.firstTimeAction({ userId: input.userId, action: 'first_vote' })
    }
  }
}
