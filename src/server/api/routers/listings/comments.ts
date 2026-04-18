import analytics from '@/lib/analytics'
import { RECAPTCHA_CONFIG } from '@/lib/captcha/config'
import { getClientIP, verifyRecaptcha } from '@/lib/captcha/verify'
import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateCommentSchema,
  EditCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
  GetSortedCommentsSchema,
  CreateVoteComment,
  PinCommentSchema,
  UnpinCommentSchema,
} from '@/schemas/listing'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { buildCommentTree, findCommentWithParent } from '@/server/api/utils/commentTree'
import { canManageCommentPins } from '@/server/api/utils/pinPermissions'
import { notificationEventEmitter, NOTIFICATION_EVENTS } from '@/server/notifications/eventEmitter'
import { CommentsRepository } from '@/server/repositories/comments.repository'
import { logAudit } from '@/server/services/audit.service'
import { isUserBanned } from '@/server/utils/query-builders'
import { handleCommentVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { roleIncludesRole } from '@/utils/permission-system'
import { canDeleteComment, canEditComment } from '@/utils/permissions'
import { AuditAction, AuditEntityType, Role } from '@orm'

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure.input(CreateCommentSchema).mutation(async ({ ctx, input }) => {
    const { listingId, content, parentId, recaptchaToken } = input
    const userId = ctx.session.user.id

    // TODO: Add spam detection via `checkSpamContent` from
    // `@/server/utils/spam-check` (currently only applied in mobile routes).
    // Block: UX/product sign-off needed since existing web users would start
    // seeing spam-block errors. Mirror mobile: `{ userId, content, entityType: 'comment' }`.
    // Verify CAPTCHA if token is provided
    if (recaptchaToken) {
      const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
      const captchaResult = await verifyRecaptcha({
        token: recaptchaToken,
        expectedAction: RECAPTCHA_CONFIG.actions.COMMENT,
        userIP: clientIP,
      })

      if (!captchaResult.success) return AppError.captcha(captchaResult.error)
    }

    // Check if listing exists
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) return ResourceError.listing.notFound()

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await ctx.prisma.comment.findUnique({ where: { id: parentId } })

      if (!parentComment) return ResourceError.comment.parentNotFound()
    }

    const userExists = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!userExists) return ResourceError.user.notInDatabase(userId)

    const repository = new CommentsRepository(ctx.prisma)
    const comment = await repository.create({
      content,
      user: { connect: { id: userId } },
      listing: { connect: { id: listingId } },
      ...(parentId && { parent: { connect: { id: parentId } } }),
    })

    notificationEventEmitter.emitNotificationEvent({
      eventType: parentId
        ? NOTIFICATION_EVENTS.COMMENT_REPLIED
        : NOTIFICATION_EVENTS.LISTING_COMMENTED,
      entityType: 'listing',
      entityId: listingId,
      triggeredBy: userId,
      payload: {
        listingId,
        commentId: comment.id,
        parentId: parentId ?? undefined,
        commentText: content,
      },
    })

    analytics.engagement.comment({
      action: parentId ? 'reply' : 'created',
      commentId: comment.id,
      listingId: listingId,
      isReply: !!parentId,
      contentLength: content.length,
    })

    // Check if this is user's first comment for journey analytics
    const userCommentCount = await ctx.prisma.comment.count({
      where: { userId: userId },
    })

    if (userCommentCount === 1) {
      analytics.userJourney.firstTimeAction({ userId: userId, action: 'first_comment' })
    }

    return comment
  }),

  get: publicProcedure.input(GetCommentsSchema).query(async ({ ctx, input }) => {
    const { listingId } = input
    const repository = new CommentsRepository(ctx.prisma)
    const comments = await repository.listByListing(listingId, ctx.session?.user?.role)
    return { comments }
  }),

  getSorted: publicProcedure.input(GetSortedCommentsSchema).query(async ({ ctx, input }) => {
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: {
        id: true,
        emulatorId: true,
        pinnedCommentId: true,
        pinnedAt: true,
        pinnedByUser: { select: { id: true, name: true, profileImage: true, role: true } },
      },
    })

    if (!listing) return ResourceError.listing.notFound()

    const canSeeBannedUsers = roleIncludesRole(ctx.session?.user?.role, Role.MODERATOR)

    const allComments = await ctx.prisma.comment.findMany({
      where: {
        listingId: input.listingId,
        ...(!canSeeBannedUsers && {
          user: {
            userBans: {
              none: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        }),
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, role: true },
        },
      },
    })

    let userCommentVotes: Record<string, boolean> = {}

    if (ctx.session?.user) {
      const votes = await ctx.prisma.commentVote.findMany({
        where: {
          userId: ctx.session.user.id,
          comment: { listingId: input.listingId },
        },
        select: { commentId: true, value: true },
      })

      userCommentVotes = votes.reduce(
        (acc, vote) => ({
          ...acc,
          [vote.commentId]: vote.value,
        }),
        {} as Record<string, boolean>,
      )
    }

    const commentsWithVotes = allComments.map((comment) => ({
      ...comment,
      userVote: userCommentVotes[comment.id] ?? null,
    }))

    let commentsTree = buildCommentTree(commentsWithVotes, { replySort: 'asc' })

    commentsTree.sort((a, b) => {
      switch (input.sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'popular':
          return (b.score ?? 0) - (a.score ?? 0)
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    let pinnedCommentPayload: {
      comment: (typeof commentsTree)[number]
      parentId: string | null
      isReply: boolean
    } | null = null

    if (listing.pinnedCommentId) {
      const located = findCommentWithParent(commentsTree, listing.pinnedCommentId)

      if (located) {
        pinnedCommentPayload = {
          comment: located.comment,
          parentId: located.parent?.id ?? null,
          isReply: Boolean(located.parent),
        }

        if (!located.parent) {
          commentsTree = commentsTree.filter((comment) => comment.id !== located.comment.id)
        }
      }
    }

    return {
      comments: commentsTree,
      pinnedComment: pinnedCommentPayload
        ? {
            comment: pinnedCommentPayload.comment,
            isReply: pinnedCommentPayload.isReply,
            parentId: pinnedCommentPayload.parentId,
            pinnedBy: listing.pinnedByUser,
            pinnedAt: listing.pinnedAt,
          }
        : null,
    }
  }),

  edit: protectedProcedure.input(EditCommentSchema).mutation(async ({ ctx, input }) => {
    const repository = new CommentsRepository(ctx.prisma)
    const comment = await repository.byId(input.commentId)

    if (!comment) return ResourceError.comment.notFound()

    if (comment.deletedAt) return ResourceError.comment.cannotEditDeleted()

    const canEdit = canEditComment(ctx.session.user.role, comment.user.id, ctx.session.user.id)

    if (!canEdit) return ResourceError.comment.noPermission('edit')

    const updatedComment = await repository.update(input.commentId, {
      content: input.content,
      isEdited: true,
      updatedAt: new Date(),
    })

    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.LISTING_COMMENTED,
      entityType: 'listing',
      entityId: updatedComment.listingId,
      triggeredBy: ctx.session.user.id,
      payload: {
        listingId: updatedComment.listingId,
        commentId: updatedComment.id,
        commentText: input.content,
      },
    })

    return updatedComment
  }),

  delete: protectedProcedure.input(DeleteCommentSchema).mutation(async ({ ctx, input }) => {
    const repository = new CommentsRepository(ctx.prisma)
    const comment = await repository.byId(input.commentId)

    if (!comment) return ResourceError.comment.notFound()

    if (comment.deletedAt) return ResourceError.comment.alreadyDeleted()

    const canDelete = canDeleteComment(ctx.session.user.role, comment.user.id, ctx.session.user.id)

    if (!canDelete) return ResourceError.comment.noPermission('delete')

    const wasPinned = comment.listing?.pinnedCommentId === comment.id

    await repository.delete(input.commentId)

    // Emit notification event
    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.COMMENT_DELETED,
      entityType: 'comment',
      entityId: comment.id,
      triggeredBy: ctx.session.user.id,
      payload: {
        listingId: comment.listingId,
        commentId: comment.id,
      },
    })

    if (wasPinned && comment.listing) {
      await ctx.prisma.listing.update({
        where: { id: comment.listing.id },
        data: {
          pinnedCommentId: null,
          pinnedByUserId: null,
          pinnedAt: null,
        },
      })

      void logAudit(ctx.prisma, {
        actorId: ctx.session.user.id,
        action: AuditAction.UNPIN,
        entityType: AuditEntityType.COMMENT,
        entityId: comment.id,
        metadata: {
          listingId: comment.listing.id,
          reason: 'comment_deleted',
        },
      })
    }

    return comment
  }),

  vote: protectedProcedure.input(CreateVoteComment).mutation(async ({ ctx, input }) => {
    const { commentId, value } = input
    const userId = ctx.session.user.id

    if (await isUserBanned(ctx.prisma, userId)) {
      return AppError.shadowBanned()
    }

    const comment = await ctx.prisma.comment.findUnique({ where: { id: commentId } })

    if (!comment) return ResourceError.comment.notFound()

    // Fetch `existingVote` inside the transaction: two concurrent votes from
    // the same user could both read null and both attempt to insert,
    // producing a Prisma P2002 on the second. Keeping the read and write
    // under the same isolation avoids the race.
    return await ctx.prisma.$transaction(async (tx) => {
      const existingVote = await tx.commentVote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })

      let voteResult
      let scoreChange: number
      let trustActionNeeded: 'upvote' | 'downvote' | 'change' | 'remove' | null = null

      if (existingVote) {
        // If vote is the same, remove the vote (toggle)
        if (existingVote.value === value) {
          await tx.commentVote.delete({
            where: { userId_commentId: { userId, commentId } },
          })

          // Update score: if removing upvote, decrement score, if removing downvote, increment score
          scoreChange = existingVote.value ? -1 : 1
          voteResult = { message: 'Vote removed' }
          trustActionNeeded = 'remove'
        } else {
          voteResult = await tx.commentVote.update({
            where: { userId_commentId: { userId, commentId } },
            data: { value },
          })

          // Update score: changing from downvote to upvote = +2, from upvote to downvote = -2
          scoreChange = value ? 2 : -2
          trustActionNeeded = 'change'
        }
      } else {
        voteResult = await tx.commentVote.create({
          data: { userId, commentId, value },
        })

        // Update score: +1 for upvote, -1 for downvote
        scoreChange = value ? 1 : -1
        trustActionNeeded = value ? 'upvote' : 'downvote'
      }

      // Update the comment score
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: { score: { increment: scoreChange } },
      })

      if (trustActionNeeded) {
        await handleCommentVoteTrustEffects({
          tx,
          trustAction: trustActionNeeded,
          newValue: value,
          previousValue: existingVote?.value ?? null,
          commentAuthorId: comment.userId,
          voterId: userId,
          commentId,
          parentEntityId: comment.listingId,
          listingType: 'handheld',
          updatedScore: updatedComment.score,
          scoreChange,
        })
      }

      // Notify comment author on new votes / direction changes; skip on toggle-off.
      if (comment && trustActionNeeded !== null && trustActionNeeded !== 'remove') {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.COMMENT_VOTED,
          entityType: 'comment',
          entityId: comment.id,
          triggeredBy: ctx.session.user.id,
          payload: {
            listingId: comment.listingId,
            commentId: comment.id,
            voteValue: value,
          },
        })
      }

      const finalVoteValue = existingVote?.value === value ? null : value
      analytics.engagement.commentVote({
        commentId: commentId,
        voteValue: finalVoteValue,
        previousVote: existingVote?.value,
        listingId: comment?.listingId,
      })

      return voteResult
    })
  }),

  pinComment: protectedProcedure.input(PinCommentSchema).mutation(async ({ ctx, input }) => {
    const { commentId, listingId, replaceExisting } = input
    const userId = ctx.session.user.id
    const userRole = ctx.session.user.role

    const comment = await ctx.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        listing: {
          select: {
            id: true,
            emulatorId: true,
            pinnedCommentId: true,
            pinnedByUserId: true,
          },
        },
      },
    })

    if (!comment) return ResourceError.comment.notFound()
    if (comment.deletedAt) return ResourceError.comment.alreadyDeleted()
    if (comment.listingId !== listingId)
      return AppError.badRequest('Comment does not belong to this listing')
    if (!comment.listing) return ResourceError.listing.notFound()

    const listing = comment.listing

    const canPin = await canManageCommentPins({
      prisma: ctx.prisma,
      userRole,
      userId,
      emulatorId: listing.emulatorId,
    })

    if (!canPin) return ResourceError.comment.noPermission('pin')

    if (listing.pinnedCommentId && listing.pinnedCommentId !== comment.id && !replaceExisting) {
      return ResourceError.comment.alreadyPinned()
    }

    const previousPinnedId = listing.pinnedCommentId

    const updatedListing = await ctx.prisma.listing.update({
      where: { id: listing.id },
      data: {
        pinnedCommentId: comment.id,
        pinnedByUserId: userId,
        pinnedAt: new Date(),
      },
      select: {
        id: true,
        pinnedCommentId: true,
        pinnedAt: true,
      },
    })

    void logAudit(ctx.prisma, {
      actorId: userId,
      action: AuditAction.PIN,
      entityType: AuditEntityType.COMMENT,
      entityId: comment.id,
      metadata: {
        listingId: listing.id,
        previousPinnedCommentId: previousPinnedId,
      },
    })

    return updatedListing
  }),

  unpinComment: protectedProcedure.input(UnpinCommentSchema).mutation(async ({ ctx, input }) => {
    const { listingId } = input
    const userId = ctx.session.user.id
    const userRole = ctx.session.user.role

    const listing = await ctx.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        emulatorId: true,
        pinnedCommentId: true,
      },
    })

    if (!listing) return ResourceError.listing.notFound()
    if (!listing.pinnedCommentId) return ResourceError.comment.notPinned()

    const canUnpin = await canManageCommentPins({
      prisma: ctx.prisma,
      userRole,
      userId,
      emulatorId: listing.emulatorId,
    })

    if (!canUnpin) return ResourceError.comment.noPermission('unpin')

    const previousPinnedId = listing.pinnedCommentId

    await ctx.prisma.listing.update({
      where: { id: listing.id },
      data: {
        pinnedCommentId: null,
        pinnedByUserId: null,
        pinnedAt: null,
      },
    })

    void logAudit(ctx.prisma, {
      actorId: userId,
      action: AuditAction.UNPIN,
      entityType: AuditEntityType.COMMENT,
      entityId: previousPinnedId,
      metadata: { listingId: listing.id },
    })

    return { success: true }
  }),
})
