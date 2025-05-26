import { createTRPCRouter } from '@/server/api/trpc'
import { coreRouter } from './listings/core'
import { commentsRouter } from './listings/comments'
import { adminRouter } from './listings/admin'

export const listingsRouter = createTRPCRouter({
  // Core listing operations
  ...coreRouter._def.procedures,
  
  // Comment operations
  createComment: commentsRouter.create,
  getComments: commentsRouter.get,
  getSortedComments: commentsRouter.getSorted,
  editComment: commentsRouter.edit,
  deleteComment: commentsRouter.delete,
  voteComment: commentsRouter.vote,
  
  // Admin operations
  getPending: adminRouter.getPending,
  approveListing: adminRouter.approve,
  rejectListing: adminRouter.reject,
  getProcessed: adminRouter.getProcessed,
  overrideApprovalStatus: adminRouter.overrideStatus,
  delete: adminRouter.delete,
})
