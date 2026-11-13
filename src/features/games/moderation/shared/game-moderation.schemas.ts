import { z } from 'zod'
import { MutationSuccessSchema } from '@/schemas/common'
import { type ApproveGameInput } from '@/schemas/game'
import { ApprovalStatus } from '@orm'

export type GameModerationStatus = ApproveGameInput['status']

export const GameModerationResultSchema = z.object({ status: z.nativeEnum(ApprovalStatus) })

export const BulkGameApprovalResultSchema = MutationSuccessSchema.extend({
  approvedCount: z.number().int().nonnegative(),
  message: z.string(),
})

export const BulkGameRejectionResultSchema = MutationSuccessSchema.extend({
  rejectedCount: z.number().int().nonnegative(),
  message: z.string(),
})
