import {
  UpdateUserPreferencesSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
} from '@/schemas/userPreferences'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository'

export const userPreferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const repository = new UserPreferencesRepository(ctx.prisma)
    return repository.get(ctx.session.user.id)
  }),

  update: protectedProcedure.input(UpdateUserPreferencesSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPreferencesRepository(ctx.prisma)
    return repository.update(ctx.session.user.id, input)
  }),

  bulkUpdateDevices: protectedProcedure
    .input(BulkUpdateDevicePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new UserPreferencesRepository(ctx.prisma)
      return repository.bulkUpdateDevices(ctx.session.user.id, input.deviceIds)
    }),

  bulkUpdateSocs: protectedProcedure
    .input(BulkUpdateSocPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new UserPreferencesRepository(ctx.prisma)
      return repository.bulkUpdateSocs(ctx.session.user.id, input.socIds)
    }),
})

export default userPreferencesRouter
