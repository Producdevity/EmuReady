import analytics from '@/lib/analytics'
import { logger } from '@/lib/logger'
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
    try {
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
    } catch (error) {
      logger.error('Committed vote notification failed', error)
    }

    try {
      analytics.engagement.vote({
        listingId: input.listingId,
        voteValue: input.action === 'deleted' ? null : input.value,
        previousVote: input.previousValue,
      })
    } catch (error) {
      logger.error('Committed vote analytics failed', error)
    }

    if (input.action !== 'created') return
    try {
      if (await this.repository.isFirstRecordedVote(input.userId)) {
        analytics.userJourney.firstTimeAction({ userId: input.userId, action: 'first_vote' })
      }
    } catch (error) {
      logger.error('Committed vote milestone analytics failed', error)
    }
  }
}
