import analytics from '@/lib/analytics'
import { RECAPTCHA_CONFIG } from '@/lib/captcha/config'
import { getClientIP, verifyRecaptcha } from '@/lib/captcha/verify'
import { AppError, ResourceError } from '@/lib/errors'
import {
  CreatePcListingCommentSchema,
  DeletePcListingCommentSchema,
  GetPcListingCommentsSchema,
  PinPcListingCommentSchema,
  UnpinPcListingCommentSchema,
  UpdatePcListingCommentSchema,
  VotePcListingCommentSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { buildCommentTree, findCommentWithParent } from '@/server/api/utils/commentTree'
import { canManageCommentPins } from '@/server/api/utils/pinPermissions'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { logAudit } from '@/server/services/audit.service'
import { isUserBanned } from '@/server/utils/query-builders'
import { handleCommentVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { canDeleteComment, canEditComment } from '@/utils/permissions'
import { AuditAction, AuditEntityType } from '@orm'

export const commentsRouter = createTRPCRouter({
  get: publicProcedure.input(GetPcListingCommentsSchema).query(async ({ ctx, input }) => {
    const { pcListingId, sortBy = 'newest', limit = 50, offset = 0 } = input

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: pcListingId },
      select: {
        id: true,
        emulatorId: true,
        pinnedCommentId: true,
        pinnedAt: true,
        pinnedByUser: { select: { id: true, name: true, profileImage: true, role: true } },
      },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    const allComments = await ctx.prisma.pcListingComment.findMany({
      where: { pcListingId, deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, role: true },
        },
      },
    })

    let userCommentVotes: Record<string, boolean> = {}
    if (ctx.session?.user) {
      const votes = await ctx.prisma.pcListingCommentVote.findMany({
        where: {
          userId: ctx.session.user.id,
          comment: { pcListingId },
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
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'score':
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

    if (pcListing.pinnedCommentId) {
      const located = findCommentWithParent(commentsTree, pcListing.pinnedCommentId)

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

    const paginatedComments = commentsTree.slice(offset, offset + limit)

    return {
      comments: paginatedComments,
      pinnedComment: pinnedCommentPayload
        ? {
            comment: pinnedCommentPayload.comment,
            isReply: pinnedCommentPayload.isReply,
            parentId: pinnedCommentPayload.parentId,
            pinnedBy: pcListing.pinnedByUser,
            pinnedAt: pcListing.pinnedAt,
          }
        : null,
    }
  }),

  create: protectedProcedure
    .input(CreatePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Add spam detection via `checkSpamContent` from
      // `@/server/utils/spam-check` (currently only applied in mobile routes).
      const { pcListingId, content, parentId, recaptchaToken } = input
      const userId = ctx.session.user.id

      if (recaptchaToken) {
        const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
        const captchaResult = await verifyRecaptcha({
          token: recaptchaToken,
          expectedAction: RECAPTCHA_CONFIG.actions.COMMENT,
          userIP: clientIP,
        })

        if (!captchaResult.success) return AppError.captcha(captchaResult.error)
      }

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (parentId) {
        const parentComment = await ctx.prisma.pcListingComment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) return ResourceError.comment.parentNotFound()
      }

      const comment = await ctx.prisma.pcListingComment.create({
        data: { content, userId, pcListingId, parentId },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })

      notificationEventEmitter.emitNotificationEvent({
        eventType: parentId
          ? NOTIFICATION_EVENTS.COMMENT_REPLIED
          : NOTIFICATION_EVENTS.LISTING_COMMENTED,
        entityType: 'pcListing',
        entityId: pcListingId,
        triggeredBy: userId,
        payload: { pcListingId, commentId: comment.id, parentId, commentText: content },
      })

      analytics.engagement.comment({
        action: parentId ? 'reply' : 'created',
        commentId: comment.id,
        listingId: pcListingId,
        isReply: !!parentId,
        contentLength: content.length,
      })

      return comment
    }),

  update: protectedProcedure
    .input(UpdatePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: input.commentId },
        include: { user: { select: { id: true } } },
      })

      if (!comment) return ResourceError.comment.notFound()
      if (comment.deletedAt) return ResourceError.comment.cannotEditDeleted()

      const canEdit = canEditComment(ctx.session.user.role, comment.user.id, ctx.session.user.id)

      if (!canEdit) {
        return ResourceError.comment.noPermission('edit')
      }

      return await ctx.prisma.pcListingComment.update({
        where: { id: input.commentId },
        data: { content: input.content, isEdited: true, updatedAt: new Date() },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })
    }),

  delete: protectedProcedure
    .input(DeletePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: input.commentId },
        include: {
          user: { select: { id: true } },
          pcListing: { select: { id: true, pinnedCommentId: true } },
        },
      })

      if (!comment) return ResourceError.comment.notFound()
      if (comment.deletedAt) return ResourceError.comment.alreadyDeleted()

      const canDelete = canDeleteComment(
        ctx.session.user.role,
        comment.user.id,
        ctx.session.user.id,
      )

      if (!canDelete) return ResourceError.comment.noPermission('delete')

      const wasPinned = comment.pcListing?.pinnedCommentId === comment.id

      const updatedComment = await ctx.prisma.pcListingComment.update({
        where: { id: input.commentId },
        data: { deletedAt: new Date() },
      })

      if (wasPinned && comment.pcListing) {
        await ctx.prisma.pcListing.update({
          where: { id: comment.pcListing.id },
          data: { pinnedCommentId: null, pinnedByUserId: null, pinnedAt: null },
        })

        void logAudit(ctx.prisma, {
          actorId: ctx.session.user.id,
          action: AuditAction.UNPIN,
          entityType: AuditEntityType.COMMENT,
          entityId: comment.id,
          metadata: { pcListingId: comment.pcListing.id, reason: 'comment_deleted' },
        })
      }

      return updatedComment
    }),

  vote: protectedProcedure.input(VotePcListingCommentSchema).mutation(async ({ ctx, input }) => {
    const { commentId, value } = input
    const userId = ctx.session.user.id

    if (await isUserBanned(ctx.prisma, userId)) {
      return AppError.shadowBanned()
    }

    const comment = await ctx.prisma.pcListingComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) return ResourceError.comment.notFound()

    // Fetch `existingVote` inside the transaction to avoid P2002 races
    // between concurrent votes on the same (user, comment) pair.
    return await ctx.prisma.$transaction(async (tx) => {
      const existingVote = await tx.pcListingCommentVote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })

      let voteResult
      let scoreChange: number
      let trustAction: 'upvote' | 'downvote' | 'change' | 'remove' | null = null

      if (existingVote) {
        if (existingVote.value === value) {
          await tx.pcListingCommentVote.delete({
            where: { userId_commentId: { userId, commentId } },
          })
          scoreChange = existingVote.value ? -1 : 1
          voteResult = { message: 'Vote removed' }
          trustAction = 'remove'
        } else {
          voteResult = await tx.pcListingCommentVote.update({
            where: { userId_commentId: { userId, commentId } },
            data: { value },
          })
          scoreChange = value ? 2 : -2
          trustAction = 'change'
        }
      } else {
        voteResult = await tx.pcListingCommentVote.create({
          data: { userId, commentId, value },
        })
        scoreChange = value ? 1 : -1
        trustAction = value ? 'upvote' : 'downvote'
      }

      const updatedComment = await tx.pcListingComment.update({
        where: { id: commentId },
        data: { score: { increment: scoreChange } },
      })

      if (trustAction) {
        await handleCommentVoteTrustEffects({
          tx,
          trustAction,
          newValue: value,
          previousValue: existingVote?.value ?? null,
          commentAuthorId: comment.userId,
          voterId: userId,
          commentId,
          parentEntityId: comment.pcListingId,
          listingType: 'pc',
          updatedScore: updatedComment.score,
          scoreChange,
        })
      }

      if (trustAction !== null && trustAction !== 'remove') {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.COMMENT_VOTED,
          entityType: 'comment',
          entityId: comment.id,
          triggeredBy: userId,
          payload: {
            pcListingId: comment.pcListingId,
            commentId: comment.id,
            voteValue: value,
          },
        })
      }

      return voteResult
    })
  }),

  pinComment: protectedProcedure
    .input(PinPcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { commentId, pcListingId, replaceExisting } = input
      const userId = ctx.session.user.id
      const userRole = ctx.session.user.role

      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: commentId },
        include: {
          pcListing: {
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
      if (comment.pcListingId !== pcListingId) {
        return AppError.badRequest('Comment does not belong to this PC listing')
      }
      if (!comment.pcListing) return ResourceError.pcListing.notFound()

      const pcListing = comment.pcListing

      const canPin = await canManageCommentPins({
        prisma: ctx.prisma,
        userRole,
        userId,
        emulatorId: pcListing.emulatorId,
      })

      if (!canPin) return ResourceError.comment.noPermission('pin')

      if (
        pcListing.pinnedCommentId &&
        pcListing.pinnedCommentId !== comment.id &&
        !replaceExisting
      ) {
        return ResourceError.comment.alreadyPinned()
      }

      const previousPinnedId = pcListing.pinnedCommentId

      const updatedPcListing = await ctx.prisma.pcListing.update({
        where: { id: pcListing.id },
        data: {
          pinnedCommentId: comment.id,
          pinnedByUserId: userId,
          pinnedAt: new Date(),
        },
        select: { id: true, pinnedCommentId: true, pinnedAt: true },
      })

      void logAudit(ctx.prisma, {
        actorId: userId,
        action: AuditAction.PIN,
        entityType: AuditEntityType.COMMENT,
        entityId: comment.id,
        metadata: {
          pcListingId: pcListing.id,
          previousPinnedCommentId: previousPinnedId,
        },
      })

      return updatedPcListing
    }),

  unpinComment: protectedProcedure
    .input(UnpinPcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId } = input
      const userId = ctx.session.user.id
      const userRole = ctx.session.user.role

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
        select: { id: true, emulatorId: true, pinnedCommentId: true },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()
      if (!pcListing.pinnedCommentId) return ResourceError.comment.notPinned()

      const canUnpin = await canManageCommentPins({
        prisma: ctx.prisma,
        userRole,
        userId,
        emulatorId: pcListing.emulatorId,
      })

      if (!canUnpin) return ResourceError.comment.noPermission('unpin')

      const previousPinnedId = pcListing.pinnedCommentId

      await ctx.prisma.pcListing.update({
        where: { id: pcListing.id },
        data: { pinnedCommentId: null, pinnedByUserId: null, pinnedAt: null },
      })

      void logAudit(ctx.prisma, {
        actorId: userId,
        action: AuditAction.UNPIN,
        entityType: AuditEntityType.COMMENT,
        entityId: previousPinnedId,
        metadata: { pcListingId: pcListing.id },
      })

      return { success: true }
    }),
})
