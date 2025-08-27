import {
  GetPcPresetsSchema,
  CreatePcPresetSchema,
  UpdatePcPresetSchema,
  DeletePcPresetSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobileProtectedProcedure } from '@/server/api/mobileContext'
import { UserPcPresetsRepository } from '@/server/repositories/user-pc-presets.repository'

export const mobilePcPresetsRouter = createMobileTRPCRouter({
  /**
   * Get current user's PC presets
   */
  get: mobileProtectedProcedure.input(GetPcPresetsSchema).query(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)
    return await repository.listByUserId(ctx.session.user.id, {
      limited: true,
      limit: input.limit,
    })
  }),

  /**
   * Create a new PC preset
   */
  create: mobileProtectedProcedure.input(CreatePcPresetSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)
    return await repository.create(
      {
        ...input,
        userId: ctx.session.user.id,
      },
      { limited: true },
    )
  }),

  /**
   * Update an existing PC preset
   */
  update: mobileProtectedProcedure.input(UpdatePcPresetSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input
    const repository = new UserPcPresetsRepository(ctx.prisma)
    return await repository.update(id, ctx.session.user.id, updateData, {
      limited: true,
      requestingUserRole: ctx.session.user.role,
    })
  }),

  /**
   * Delete a PC preset
   */
  delete: mobileProtectedProcedure.input(DeletePcPresetSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPcPresetsRepository(ctx.prisma)
    await repository.delete(input.id, ctx.session.user.id, {
      requestingUserRole: ctx.session.user.role,
    })
    return { success: true }
  }),
})
