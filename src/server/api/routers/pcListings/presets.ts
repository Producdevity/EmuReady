import {
  CreatePcPresetSchema,
  DeletePcPresetSchema,
  GetPcPresetsSchema,
  UpdatePcPresetSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { UserPcPresetsRepository } from '@/server/repositories/user-pc-presets.repository'

export const presetsRouter = createTRPCRouter({
  get: protectedProcedure.input(GetPcPresetsSchema).query(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)
    const userId = input.userId ?? ctx.session.user.id

    return await repository.listByUserId(userId, {
      requestingUserId: ctx.session.user.id,
      userRole: ctx.session.user.role,
    })
  }),

  create: protectedProcedure.input(CreatePcPresetSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)

    return await repository.create({
      userId: ctx.session.user.id,
      name: input.name,
      cpuId: input.cpuId,
      gpuId: input.gpuId,
      memorySize: input.memorySize,
      os: input.os,
      osVersion: input.osVersion,
      platformId: input.platformId ?? null,
    })
  }),

  update: protectedProcedure.input(UpdatePcPresetSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const repository = new UserPcPresetsRepository(ctx.prisma)

    return await repository.update(id, ctx.session.user.id, data, {
      requestingUserRole: ctx.session.user.role,
    })
  }),

  delete: protectedProcedure.input(DeletePcPresetSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)
    await repository.delete(input.id, ctx.session.user.id, {
      requestingUserRole: ctx.session.user.role,
    })
    return { success: true }
  }),
})
