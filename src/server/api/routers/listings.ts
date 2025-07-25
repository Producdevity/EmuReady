import { createTRPCRouter } from '@/server/api/trpc'
import { adminRouter } from './listings/admin'
import { commentsRouter } from './listings/comments'
import { coreRouter } from './listings/core'

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
  bulkApproveListing: adminRouter.bulkApprove,
  bulkRejectListing: adminRouter.bulkReject,
  getProcessed: adminRouter.getProcessed,
  overrideApprovalStatus: adminRouter.overrideStatus,
  delete: adminRouter.delete,
  getStats: adminRouter.getStats,

  // Super admin operations for listing management
  getAllListings: adminRouter.getAll,
  getForEdit: adminRouter.getForEdit,
  updateListingAdmin: adminRouter.updateListing,
})
