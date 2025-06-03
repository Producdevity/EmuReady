import { type Prisma } from '@orm'
import { canDeleteComment, canEditComment } from '@/utils/permissions'
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

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, content, parentId } = input
      const userId = ctx.session.user.id

      // Check if listing exists
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        ResourceError.listing.notFound()
      }

      // If parentId is provided, check if parent comment exists
      if (parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) {
          ResourceError.comment.parentNotFound()
        }
      }

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) {
        ResourceError.user.notInDatabase(userId)
      }

      return ctx.prisma.comment.create({
        data: {
          content,
          userId,
          listingId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
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
      // Build appropriate order by clause based on sort selection
      let orderBy: Prisma.CommentOrderByWithRelationInput

      switch (input.sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' }
          break
        case 'oldest':
          orderBy = { createdAt: 'asc' }
          break
        case 'popular':
          orderBy = { score: 'desc' }
          break
        default:
          orderBy = { createdAt: 'desc' }
      }

      // Get all top-level comments
      const comments = await ctx.prisma.comment.findMany({
        where: {
          listingId: input.listingId,
          parentId: null, // Only get top-level comments
        },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, profileImage: true } },
              _count: { select: { replies: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true } },
        },
        orderBy,
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

      // Transform comments to include user vote and reply count
      const transformedComments = comments.map((comment) => {
        const transformedReplies = comment.replies.map((reply) => {
          return {
            ...reply,
            userVote: userCommentVotes[reply.id] ?? null,
            replyCount: reply._count.replies,
          }
        })

        return {
          ...comment,
          userVote: userCommentVotes[comment.id] ?? null,
          replyCount: comment._count.replies,
          replies: transformedReplies,
        }
      })

      return { comments: transformedComments }
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

      if (!canEdit) {
        AppError.forbidden('You do not have permission to edit this comment')
      }

      return ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          isEdited: true,
          updatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      })
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

      if (!canDelete) {
        AppError.forbidden('You do not have permission to delete this comment')
      }

      return ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { deletedAt: new Date() },
      })
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

        return voteResult
      })
    }),
})
