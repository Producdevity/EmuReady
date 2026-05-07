import { createTRPCRouter } from '@/server/api/trpc'
import { adminRouter } from './pcListings/admin'
import { commentsRouter } from './pcListings/comments'
import { coreRouter } from './pcListings/core'
import { presetsRouter } from './pcListings/presets'
import { verificationsRouter } from './pcListings/verifications'

export const pcListingsRouter = createTRPCRouter({
  ...coreRouter._def.procedures,

  presets: presetsRouter,

  getComments: commentsRouter.get,
  createComment: commentsRouter.create,
  updateComment: commentsRouter.update,
  deleteComment: commentsRouter.delete,
  voteComment: commentsRouter.vote,
  pinComment: commentsRouter.pinComment,
  unpinComment: commentsRouter.unpinComment,

  pending: adminRouter.pending,
  approve: adminRouter.approve,
  reject: adminRouter.reject,
  resetToPending: adminRouter.resetToPending,
  bulkApprove: adminRouter.bulkApprove,
  bulkReject: adminRouter.bulkReject,
  getAll: adminRouter.getAll,
  getForEdit: adminRouter.getForEdit,
  updateAdmin: adminRouter.updateAdmin,
  stats: adminRouter.stats,
  getReports: adminRouter.getReports,
  updateReport: adminRouter.updateReport,

  verify: verificationsRouter.verify,
  removeVerification: verificationsRouter.removeVerification,
  getVerifications: verificationsRouter.getVerifications,
})
