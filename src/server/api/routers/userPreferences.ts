import {
  UpdateUserPreferencesSchema,
  AddDevicePreferenceSchema,
  RemoveDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
} from '@/schemas/userPreferences'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository'

export const userPreferencesRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) return null

    const repository = new UserPreferencesRepository(ctx.prisma)
    return repository.get(ctx.session.user.id)
  }),

  update: protectedProcedure.input(UpdateUserPreferencesSchema).mutation(async ({ ctx, input }) => {
    const repository = new UserPreferencesRepository(ctx.prisma)
    return repository.update(ctx.session.user.id, input)
  }),

  addDevice: protectedProcedure
    .input(AddDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new UserPreferencesRepository(ctx.prisma)
      return repository.addDevice(ctx.session.user.id, input.deviceId)
    }),

  removeDevice: protectedProcedure
    .input(RemoveDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new UserPreferencesRepository(ctx.prisma)
      return repository.removeDevice(ctx.session.user.id, input.deviceId)
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
