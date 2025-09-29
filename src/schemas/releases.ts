import { z } from 'zod'

export const GetLatestReleaseSchema = z.object({
  channel: z.enum(['stable', 'beta']).default('stable').optional(),
})

export const SignDownloadSchema = z.object({
  releaseId: z.string().uuid(),
})

export type GetLatestReleaseInput = z.infer<typeof GetLatestReleaseSchema>
export type SignDownloadInput = z.infer<typeof SignDownloadSchema>
