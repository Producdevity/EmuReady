import { GetEmulatorByIdSchema, GetEmulatorsSchema } from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { EmulatorsRepository } from '@/server/repositories/emulators.repository'

export const mobileEmulatorsRouter = createMobileTRPCRouter({
  /**
   * Get emulators with search and filtering
   */
  get: mobilePublicProcedure.input(GetEmulatorsSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    const { emulators } = await repository.list(
      {
        search: input?.search,
        systemId: input?.systemId ?? null,
        limit: input?.limit,
        sortField: 'listingCount',
        sortDirection: 'desc',
      },
      { minimal: true },
    )

    return emulators
  }),

  /**
   * Get emulator by ID
   */
  byId: mobilePublicProcedure.input(GetEmulatorByIdSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.byId(input.id, { minimal: true })
  }),
})
