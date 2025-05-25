import type { Prisma } from '@orm'
import { userPublicSelect } from '../users/fragments'

// Basic comment include
export const commentBasicInclude = {
  user: {
    select: userPublicSelect,
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude

// Comment with replies
export const commentWithRepliesInclude = {
  ...commentBasicInclude,
  replies: {
    where: {
      deletedAt: null,
    },
    include: commentBasicInclude,
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
} satisfies Prisma.CommentInclude
