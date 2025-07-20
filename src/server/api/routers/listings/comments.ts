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
} from '@/schemas/listing'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc'
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { canDeleteComment, canEditComment } from '@/utils/permissions'

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, content, parentId, recaptchaToken } = input
      const userId = ctx.session.user.id

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
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) return ResourceError.comment.parentNotFound()
      }

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) return ResourceError.user.notInDatabase(userId)

      const comment = await ctx.prisma.comment.create({
        data: { content, userId, listingId, parentId },
        include: { user: { select: { id: true, name: true } } },
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
          parentId,
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
        analytics.userJourney.firstTimeAction({
          userId: userId,
          action: 'first_comment',
        })
      }

      return comment
    }),

  get: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { listingId } = input

      const comments = await ctx.prisma.comment.findMany({
        where: {
          listingId,
          parentId: null, // Only get top-level comments
          deletedAt: null, // Don't show soft-deleted comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
          },
          replies: {
            where: {
              deletedAt: null, // Don't show soft-deleted replies
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return { comments }
    }),

  getSorted: publicProcedure
    .input(GetSortedCommentsSchema)
    .query(async ({ ctx, input }) => {
      // Get ALL comments for this listing (not just top-level)
      const allComments = await ctx.prisma.comment.findMany({
        where: {
          listingId: input.listingId,
        },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })

      // Get all comment votes for the user if logged in
      let userCommentVotes: Record<string, boolean> = {}

      if (ctx.session?.user) {
        const votes = await ctx.prisma.commentVote.findMany({
          where: {
            userId: ctx.session.user.id,
            comment: { listingId: input.listingId },
          },
          select: { commentId: true, value: true },
        })

        // Create a lookup map of commentId -> vote value
        userCommentVotes = votes.reduce(
          (acc, vote) => ({
            ...acc,
            [vote.commentId]: vote.value,
          }),
          {} as Record<string, boolean>,
        )
      }

      type CommentWithExtras = (typeof allComments)[0] & {
        userVote: boolean | null
        replies: CommentWithExtras[]
        replyCount: number
      }

      // Build the tree structure
      const buildCommentTree = (
        comments: typeof allComments,
      ): CommentWithExtras[] => {
        const topLevelComments: CommentWithExtras[] = []
        const childrenMap = new Map<string, CommentWithExtras[]>()

        // First pass: organize comments by parent
        for (const comment of comments) {
          const commentWithExtras: CommentWithExtras = {
            ...comment,
            userVote: userCommentVotes[comment.id] ?? null,
            replies: [], // Will be populated below
            replyCount: 0, // Will be calculated below
          }

          if (!comment.parentId) {
            topLevelComments.push(commentWithExtras)
          } else {
            if (!childrenMap.has(comment.parentId)) {
              childrenMap.set(comment.parentId, [])
            }
            childrenMap.get(comment.parentId)!.push(commentWithExtras)
          }
        }

        // Second pass: attach children to parents recursively
        const attachReplies = (
          comment: CommentWithExtras,
        ): CommentWithExtras => {
          const children = childrenMap.get(comment.id) || []

          // Sort children by creation date (ascending for replies)
          children.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )

          // Recursively attach replies to children
          comment.replies = children.map(attachReplies)
          comment.replyCount = children.length

          return comment
        }

        return topLevelComments.map(attachReplies)
      }

      const commentsTree = buildCommentTree(allComments)

      // Sort top-level comments according to the sort criteria
      commentsTree.sort((a, b) => {
        switch (input.sortBy) {
          case 'newest':
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          case 'oldest':
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          case 'popular':
            return (b.score ?? 0) - (a.score ?? 0)
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        }
      })

      return { comments: commentsTree }
    }),

  edit: protectedProcedure
    .input(EditCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        include: { user: { select: { id: true } } },
      })
      if (!comment) return ResourceError.comment.notFound()

      if (comment.deletedAt) return ResourceError.comment.cannotEditDeleted()

      const canEdit = canEditComment(
        ctx.session.user.role,
        comment.user.id,
        ctx.session.user.id,
      )

      if (!canEdit) return ResourceError.comment.noPermission('edit')

      const updatedComment = await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          isEdited: true,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })

      // Emit notification event
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

  delete: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        include: { user: { select: { id: true } } },
      })

      if (!comment) return ResourceError.comment.notFound()

      if (comment.deletedAt) return ResourceError.comment.alreadyDeleted()

      const canDelete = canDeleteComment(
        ctx.session.user.role,
        comment.user.id,
        ctx.session.user.id,
      )

      if (!canDelete) return ResourceError.comment.noPermission('delete')

      const deletedComment = await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { deletedAt: new Date() },
      })

      // Emit notification event
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.COMMENT_DELETED,
        entityType: 'comment',
        entityId: deletedComment.id,
        triggeredBy: ctx.session.user.id,
        payload: {
          listingId: deletedComment.listingId,
          commentId: deletedComment.id,
        },
      })

      return deletedComment
    }),

  vote: protectedProcedure
    .input(CreateVoteComment)
    .mutation(async ({ ctx, input }) => {
      const { commentId, value } = input
      const userId = ctx.session.user.id

      const comment = await ctx.prisma.comment.findUnique({
        where: { id: commentId },
      })

      if (!comment) {
        ResourceError.comment.notFound()
      }

      // Check if user already voted on this comment
      const existingVote = await ctx.prisma.commentVote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })

      // Start a transaction to handle both the vote and score update
      return ctx.prisma.$transaction(async (tx) => {
        let voteResult
        let scoreChange: number

        if (existingVote) {
          // If vote is the same, remove the vote (toggle)
          if (existingVote.value === value) {
            await tx.commentVote.delete({
              where: { userId_commentId: { userId, commentId } },
            })

            // Update score: if removing upvote, decrement score, if removing downvote, increment score
            scoreChange = existingVote.value ? -1 : 1
            voteResult = { message: 'Vote removed' }
          } else {
            voteResult = await tx.commentVote.update({
              where: { userId_commentId: { userId, commentId } },
              data: { value },
            })

            // Update score: changing from downvote to upvote = +2, from upvote to downvote = -2
            scoreChange = value ? 2 : -2
          }
        } else {
          voteResult = await tx.commentVote.create({
            data: { userId, commentId, value },
          })

          // Update score: +1 for upvote, -1 for downvote
          scoreChange = value ? 1 : -1
        }

        // Update the comment score
        await tx.comment.update({
          where: { id: commentId },
          data: { score: { increment: scoreChange } },
        })

        // Emit notification event
        if (comment) {
          notificationEventEmitter.emitNotificationEvent({
            eventType: value
              ? NOTIFICATION_EVENTS.COMMENT_VOTED
              : NOTIFICATION_EVENTS.COMMENT_VOTED,
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
})
