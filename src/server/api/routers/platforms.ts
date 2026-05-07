import { ResourceError } from '@/lib/errors'
import {
  GetCompatiblePlatformsSchema,
  GetPlatformByIdSchema,
  GetPlatformsSchema,
} from '@/schemas/platform'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { PlatformsRepository } from '@/server/repositories/platforms.repository'

export const platformsRouter = createTRPCRouter({
  get: publicProcedure.input(GetPlatformsSchema).query(async ({ ctx, input }) => {
    const repository = new PlatformsRepository(ctx.prisma)
    return repository.list({
      scope: input?.scope,
      scopes: input?.scopes,
    })
  }),

  byId: publicProcedure.input(GetPlatformByIdSchema).query(async ({ ctx, input }) => {
    const repository = new PlatformsRepository(ctx.prisma)
    const platform = await repository.byId(input.id)
    if (!platform) throw ResourceError.platform.notFound()
    return platform
  }),

  getCompatible: publicProcedure
    .input(GetCompatiblePlatformsSchema)
    .query(async ({ ctx, input }) => {
      const repository = new PlatformsRepository(ctx.prisma)
      if (input.kind === 'device') {
        return repository.listCompatibleForDevice(input.deviceId)
      }
      return repository.listCompatibleForOs(input.os)
    }),
})
