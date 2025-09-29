import {
  AdminCreateReleaseSchema,
  AdminListReleasesSchema,
  AdminGetUploadUrlSchema,
  AdminPublishLatestSchema,
  AdminDeleteReleaseSchema,
} from '@/schemas/releasesAdmin'
import { createTRPCRouter, adminProcedure } from '@/server/api/trpc'
import { ReleasesRepository } from '@/server/repositories/releases.repository'
import { presignPutObject, putJson, deleteObject } from '@/server/services/r2.service'

export const adminReleasesRouter = createTRPCRouter({
  getUploadUrl: adminProcedure.input(AdminGetUploadUrlSchema).mutation(async ({ input }) => {
    const bucket = process.env.R2_BUCKET
    const publicBase = process.env.R2_PUBLIC_BASE_URL
    if (!bucket || !publicBase) throw new Error('R2 env missing')
    const baseName = input.fileName || `emuready_${input.versionName}.apk`
    const key = `android/${input.channel}/${baseName}`
    const { url } = await presignPutObject({
      bucket,
      key,
      contentType: 'application/vnd.android.package-archive',
    })
    return { key, url }
  }),
  create: adminProcedure.input(AdminCreateReleaseSchema).mutation(async ({ ctx, input }) => {
    const repo = new ReleasesRepository(ctx.prisma)
    return repo.create(input)
  }),

  list: adminProcedure.input(AdminListReleasesSchema).query(async ({ ctx, input }) => {
    const repo = new ReleasesRepository(ctx.prisma)
    return repo.list({ channel: input.channel, limit: input.limit })
  }),

  publishLatest: adminProcedure.input(AdminPublishLatestSchema).mutation(async ({ input }) => {
    const bucket = process.env.R2_BUCKET
    const publicBase = process.env.R2_PUBLIC_BASE_URL
    if (!bucket || !publicBase) throw new Error('R2 env missing')
    const apkUrl = `${publicBase}/${input.fileKey}`
    const latest = {
      channel: input.channel,
      versionCode: input.versionCode,
      versionName: input.versionName,
      apkUrl,
      sha256: input.fileSha256,
      sizeBytes: input.sizeBytes,
      notesUrl: input.notesUrl,
    }
    const latestKey = `android/${input.channel}/latest.json`
    await putJson({ bucket, key: latestKey, body: latest, cacheControl: 'public, max-age=60' })
    return { ok: true, latestUrl: `${publicBase}/${latestKey}` }
  }),
  delete: adminProcedure.input(AdminDeleteReleaseSchema).mutation(async ({ ctx, input }) => {
    const repo = new ReleasesRepository(ctx.prisma)
    const rel = await ctx.prisma.release.findUnique({ where: { id: input.id } })
    if (!rel) return repo.delete(input.id)
    if (input.deleteFromR2) {
      const bucket = process.env.R2_BUCKET
      if (bucket) {
        try {
          await deleteObject({ bucket, key: rel.fileKey })
        } catch {
          // Ignore storage deletion failure; proceed with DB delete
        }
      }
    }
    // Delete the record
    const deleted = await repo.delete(input.id)
    // Republish latest.json to previous release (if any)
    try {
      const latest = await ctx.prisma.release.findFirst({
        where: { channel: rel.channel },
        orderBy: [{ versionCode: 'desc' }, { createdAt: 'desc' }],
      })
      if (latest) {
        const publicBase = process.env.R2_PUBLIC_BASE_URL
        if (!publicBase) return deleted
        const bucket = process.env.R2_BUCKET
        if (!bucket) return deleted
        const apkUrl = `${publicBase}/${latest.fileKey}`
        const latestKey = `android/${latest.channel}/latest.json`
        await putJson({
          bucket,
          key: latestKey,
          body: {
            channel: latest.channel,
            versionCode: latest.versionCode,
            versionName: latest.versionName,
            apkUrl,
            sha256: latest.fileSha256,
            sizeBytes: Number(latest.sizeBytes),
          },
          cacheControl: 'public, max-age=60',
        })
      }
    } catch {
      // best-effort
    }
    return deleted
  }),
})
