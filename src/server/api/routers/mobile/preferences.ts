import { ResourceError } from '@/lib/errors'
import {
  AddDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
  GetUserProfileSchema,
  RemoveDevicePreferenceSchema,
  UpdateProfileSchema,
  UpdateUserPreferencesSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobileProtectedProcedure } from '@/server/api/mobileContext'
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository'
import { checkProfileAccess } from '@/server/services/user-profile.service'

export const mobilePreferencesRouter = createMobileTRPCRouter({
  get: mobileProtectedProcedure.query(async ({ ctx }) => {
    const repo = new UserPreferencesRepository(ctx.prisma)
    return repo.get(ctx.session.user.id)
  }),

  update: mobileProtectedProcedure
    .input(UpdateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.update(ctx.session.user.id, input)
    }),

  // TODO: Find out if this is even used or needed, since we use bulkUpdateDevices on web
  addDevice: mobileProtectedProcedure
    .input(AddDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.addDevice(ctx.session.user.id, input.deviceId)
    }),

  // TODO: Find out if this is even used or needed, since we use bulkUpdateDevices on web
  removeDevice: mobileProtectedProcedure
    .input(RemoveDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.removeDevice(ctx.session.user.id, input.deviceId)
    }),

  bulkUpdateDevices: mobileProtectedProcedure
    .input(BulkUpdateDevicePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.bulkUpdateDevices(ctx.session.user.id, input.deviceIds)
    }),

  bulkUpdateSocs: mobileProtectedProcedure
    .input(BulkUpdateSocPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.bulkUpdateSocs(ctx.session.user.id, input.socIds)
    }),

  currentProfile: mobileProtectedProcedure.query(async ({ ctx }) => {
    const repo = new UserPreferencesRepository(ctx.prisma)
    return repo.getCurrentProfile(ctx.session.user.id)
  }),

  profile: mobileProtectedProcedure.input(GetUserProfileSchema).query(async ({ ctx, input }) => {
    const access = await checkProfileAccess(ctx.prisma, input.userId, {
      currentUserId: ctx.session.user.id,
      currentUserRole: ctx.session.user.role,
    })

    if (!access.accessible) {
      if (access.reason === 'not_found') return null
      if (access.reason === 'banned') return ResourceError.user.profileNotAccessible()

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, createdAt: true },
      })
      if (!user) return null
      return { ...user, bio: null, _count: { listings: 0, votes: 0, comments: 0 } }
    }

    return await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
        bio: true,
        createdAt: true,
        _count: { select: { listings: true, votes: true, comments: true } },
      },
    })
  }),

  updateProfile: mobileProtectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new UserPreferencesRepository(ctx.prisma)
      return repo.updateProfile(ctx.session.user.id, input)
    }),
})
