import { env } from '@/lib/env'
import { GetLatestReleaseSchema, SignDownloadSchema } from '@/schemas/releases'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { EntitlementsRepository } from '@/server/repositories/entitlements.repository'
import { ReleasesRepository } from '@/server/repositories/releases.repository'
import { presignGetObject } from '@/server/services/r2.service'

export const releasesRouter = createTRPCRouter({
  latest: publicProcedure.input(GetLatestReleaseSchema).query(async ({ ctx, input }) => {
    const repo = new ReleasesRepository(ctx.prisma)
    const channel = input?.channel ?? 'stable'
    const latest = await repo.latest(channel)
    if (latest) {
      // If DB has a record, build the CDN URL directly from the stored fileKey
      const publicBase = process.env.R2_PUBLIC_BASE_URL
      const apkUrl = publicBase ? `${publicBase}/${latest.fileKey}` : env.ANDROID_LATEST_APK_URL
      return {
        channel: latest.channel as 'stable' | 'beta',
        versionCode: latest.versionCode,
        versionName: latest.versionName,
        apkUrl,
        sha256: latest.fileSha256,
        sizeBytes: Number(latest.sizeBytes),
        notesUrl: undefined,
        id: latest.id,
      }
    }
    // No DB release → return null to hide download UI
    return null as unknown as undefined
  }),

  // Records a download (and could issue a signed URL in the future)
  signDownload: protectedProcedure.input(SignDownloadSchema).mutation(async ({ ctx, input }) => {
    const entRepo = new EntitlementsRepository(ctx.prisma)
    const eligible = await entRepo.eligible(ctx.session.user.id)
    if (!eligible) return { url: env.ANDROID_LATEST_APK_URL }

    const release = await ctx.prisma.release.findUnique({ where: { id: input.releaseId } })
    if (!release) return { url: env.ANDROID_LATEST_APK_URL }

    await ctx.prisma.download.create({
      data: {
        userId: ctx.session.user.id,
        releaseId: release.id,
        ip: ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: ctx.headers?.get('user-agent') ?? null,
      },
    })
    try {
      const bucket = process.env.R2_BUCKET
      if (!bucket) throw new Error('R2_BUCKET missing')
      const { url } = await presignGetObject({ bucket, key: release.fileKey, expiresIn: 900 })
      return { url }
    } catch {
      // Fallback to public URL if presign fails
      const publicBase = process.env.R2_PUBLIC_BASE_URL
      const url = publicBase ? `${publicBase}/${release.fileKey}` : env.ANDROID_LATEST_APK_URL
      return { url }
    }
  }),
})
