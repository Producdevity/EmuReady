import { createTRPCRouter } from '@/server/api/trpc'
import { adminRouter } from './pcListings/admin'
import { commentsRouter } from './pcListings/comments'
import { coreRouter } from './pcListings/core'

export const pcListingsRouter = createTRPCRouter({
  // Core listing operations (CRUD, voting, verification, presets)
  ...coreRouter._def.procedures,

  // Admin operations
  pending: adminRouter.getPending,
  approve: adminRouter.approve,
  reject: adminRouter.reject,
  resetToPending: adminRouter.resetToPending,
  getProcessed: adminRouter.getProcessed,
  overrideStatus: adminRouter.overrideStatus,
  bulkApprove: adminRouter.bulkApprove,
  bulkReject: adminRouter.bulkReject,
  autoRejectRiskyPreview: adminRouter.autoRejectRiskyPreview,
  autoRejectRisky: adminRouter.autoRejectRisky,
  getAll: adminRouter.get,
  getForEdit: adminRouter.getForEdit,
  updateAdmin: adminRouter.updateListing,
  stats: adminRouter.stats,

  // Comment operations
  getComments: commentsRouter.get,
  createComment: commentsRouter.create,
  updateComment: commentsRouter.edit,
  deleteComment: commentsRouter.delete,
  voteComment: commentsRouter.vote,
  pinComment: commentsRouter.pinComment,
  unpinComment: commentsRouter.unpinComment,
})
