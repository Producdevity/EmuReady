import analytics from '@/lib/analytics'
import { ResourceError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { notificationEventEmitter, NOTIFICATION_EVENTS } from '@/server/notifications/eventEmitter'
import { CommentsRepository, type MinimalComment } from '@/server/repositories/comments.repository'
import { checkSpamContent } from '@/server/utils/spam-check'
import { type PrismaClient } from '@orm/client'

interface CreateListingCommentInput {
  listingId: string
  content: string
  userId: string
  parentId?: string | null
  humanVerificationToken?: string
  headers?: Headers
}

export class ListingCommentService {
  private readonly comments: CommentsRepository

  constructor(private readonly prisma: PrismaClient) {
    this.comments = new CommentsRepository(prisma)
  }

  async create(input: CreateListingCommentInput): Promise<MinimalComment> {
    if (!(await this.comments.listingExists(input.listingId))) {
      return ResourceError.listing.notFound()
    }

    if (
      input.parentId &&
      !(await this.comments.commentBelongsToListing(input.parentId, input.listingId))
    ) {
      return ResourceError.comment.parentNotFound()
    }

    if (!(await this.comments.userExists(input.userId))) {
      return ResourceError.user.notInDatabase(input.userId)
    }

    await checkSpamContent({
      prisma: this.prisma,
      userId: input.userId,
      content: input.content,
      entityType: 'comment',
      challengeMode: 'challenge',
      humanVerificationToken: input.humanVerificationToken,
      headers: input.headers,
    })

    const comment = await this.comments.createForListing({
      content: input.content,
      userId: input.userId,
      listingId: input.listingId,
      parentId: input.parentId ?? undefined,
    })

    this.emitCreatedNotification(comment.id, input)
    this.trackCreatedComment(comment.id, input)
    void this.trackFirstComment(input.userId).catch((error: unknown) => {
      logger.error('[ListingCommentService] Failed to track first comment analytics', error, {
        userId: input.userId,
        commentId: comment.id,
      })
    })

    return comment
  }

  private emitCreatedNotification(commentId: string, input: CreateListingCommentInput): void {
    notificationEventEmitter.emitNotificationEvent({
      eventType: input.parentId
        ? NOTIFICATION_EVENTS.COMMENT_REPLIED
        : NOTIFICATION_EVENTS.LISTING_COMMENTED,
      entityType: 'listing',
      entityId: input.listingId,
      triggeredBy: input.userId,
      payload: {
        listingId: input.listingId,
        commentId,
        parentId: input.parentId ?? undefined,
        commentText: input.content,
      },
    })
  }

  private trackCreatedComment(commentId: string, input: CreateListingCommentInput): void {
    analytics.engagement.comment({
      action: input.parentId ? 'reply' : 'created',
      commentId,
      listingId: input.listingId,
      isReply: Boolean(input.parentId),
      contentLength: input.content.length,
    })
  }

  private async trackFirstComment(userId: string): Promise<void> {
    const userCommentCount = await this.comments.countByUser(userId)

    if (userCommentCount === 1) {
      analytics.userJourney.firstTimeAction({ userId, action: 'first_comment' })
    }
  }
}
