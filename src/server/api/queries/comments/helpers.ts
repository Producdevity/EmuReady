import type { Prisma } from '@orm'
import { prisma } from '@/server/db'
import { userPublicSelect } from '../users/fragments'

// Helper to get comments with user votes
export async function getCommentsWithVotes(
  listingId: string,
  userId?: string,
  orderBy: Prisma.CommentOrderByWithRelationInput = { createdAt: 'desc' },
) {
  const comments = await prisma.comment.findMany({
    where: {
      listingId,
      parentId: null,
      deletedAt: null,
    },
    include: {
      user: {
        select: userPublicSelect,
      },
      replies: {
        where: { deletedAt: null },
        include: {
          user: {
            select: userPublicSelect,
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { replies: true },
      },
    },
    orderBy,
  })

  if (!userId) {
    return comments.map((comment) => ({
      ...comment,
      userVote: null,
      replies: comment.replies.map((reply) => ({
        ...reply,
        userVote: null,
      })),
    }))
  }

  // Get user votes for all comments
  const commentIds = [
    ...comments.map((c) => c.id),
    ...comments.flatMap((c) => c.replies.map((r) => r.id)),
  ]

  const userVotes = await prisma.commentVote.findMany({
    where: {
      userId,
      commentId: { in: commentIds },
    },
    select: {
      commentId: true,
      value: true,
    },
  })

  const voteMap = new Map(userVotes.map((v) => [v.commentId, v.value]))

  return comments.map((comment) => ({
    ...comment,
    userVote: voteMap.get(comment.id) ?? null,
    replies: comment.replies.map((reply) => ({
      ...reply,
      userVote: voteMap.get(reply.id) ?? null,
    })),
  }))
}
