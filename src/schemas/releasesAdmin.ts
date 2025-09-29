import { z } from 'zod'

export const AdminCreateReleaseSchema = z.object({
  channel: z.enum(['stable', 'beta']),
  versionCode: z.number().int().positive(),
  versionName: z.string().min(1).max(50),
  fileKey: z.string().min(1),
  fileSha256: z.string().min(32),
  sizeBytes: z.union([z.number().int().positive(), z.bigint().positive()]),
  notes: z.string().max(5000).optional(),
})

export const AdminListReleasesSchema = z.object({
  channel: z.enum(['stable', 'beta']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type AdminCreateReleaseInput = z.infer<typeof AdminCreateReleaseSchema>
export type AdminListReleasesInput = z.infer<typeof AdminListReleasesSchema>

export const AdminGetUploadUrlSchema = AdminCreateReleaseSchema.pick({
  channel: true,
  versionName: true,
}).extend({
  fileName: z.string().optional(),
})

export const AdminPublishLatestSchema = AdminCreateReleaseSchema.pick({
  channel: true,
  versionCode: true,
  versionName: true,
}).extend({
  fileKey: z.string().min(1),
  fileSha256: z.string().min(32),
  sizeBytes: z.number().int().positive(),
  notesUrl: z.string().url().optional(),
})

export type AdminGetUploadUrlInput = z.infer<typeof AdminGetUploadUrlSchema>
export type AdminPublishLatestInput = z.infer<typeof AdminPublishLatestSchema>

export const AdminDeleteReleaseSchema = z.object({
  id: z.string().uuid(),
  deleteFromR2: z.boolean().optional(),
})
export type AdminDeleteReleaseInput = z.infer<typeof AdminDeleteReleaseSchema>
