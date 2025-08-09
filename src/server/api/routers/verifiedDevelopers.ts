import { AppError, ResourceError } from '@/lib/errors'
import {
  GetVerifiedDevelopersSchema,
  IsVerifiedDeveloperSchema,
  RemoveVerifiedDeveloperSchema,
  UpdateVerifiedDeveloperSchema,
  VerifyDeveloperSchema,
} from '@/schemas/verifiedDeveloper'
import {
  createTRPCRouter,
  manageEmulatorVerifiedDevelopersProcedure,
  protectedProcedure,
} from '@/server/api/trpc'
import { userSelect, userIdNameSelect, emulatorBasicSelect } from '@/server/utils/selects'
import { hasPermission } from '@/utils/permissions'
import { Role, Prisma } from '@orm'

export const verifiedDevelopersRouter = createTRPCRouter({
  getVerifiedDevelopers: manageEmulatorVerifiedDevelopersProcedure
    .input(GetVerifiedDevelopersSchema)
    .query(async ({ ctx, input }) => {
      const { emulatorId, userId, limit, page, search, emulatorFilter } = input ?? {}
      const actualLimit = limit ?? 50
      const actualPage = page ?? 1
      const skip = (actualPage - 1) * actualLimit

      const mode = Prisma.QueryMode.insensitive
      const where: Prisma.VerifiedDeveloperWhereInput = {
        ...(emulatorId && { emulatorId }),
        ...(userId && { userId }),
        ...(emulatorFilter && { emulatorId: emulatorFilter }),
      }

      // Add search functionality
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim()
        where.OR = [
          {
            user: {
              OR: [
                { name: { contains: searchTerm, mode } },
                { email: { contains: searchTerm, mode } },
              ],
            },
          },
          { emulator: { name: { contains: searchTerm, mode } } },
          { notes: { contains: searchTerm, mode } },
        ]
      }

      const [verifiedDevelopers, total] = await Promise.all([
        ctx.prisma.verifiedDeveloper.findMany({
          where,
          include: {
            user: {
              select: userSelect(['id', 'name', 'email', 'profileImage', 'role']),
            },
            emulator: { select: emulatorBasicSelect },
            verifier: { select: userSelect(['id', 'name', 'email']) },
          },
          orderBy: { verifiedAt: 'desc' },
          skip,
          take: actualLimit,
        }),
        ctx.prisma.verifiedDeveloper.count({ where }),
      ])

      return {
        verifiedDevelopers,
        pagination: {
          page: actualPage,
          pages: Math.ceil(total / actualLimit),
          total,
          limit: actualLimit,
        },
      }
    }),

  verifyDeveloper: manageEmulatorVerifiedDevelopersProcedure
    .input(VerifyDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, emulatorId, notes } = input
      const verifierId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: userSelect(['id', 'name', 'email', 'role']),
      })

      if (!user) return ResourceError.user.notFound()

      // Check if user has DEVELOPER role or higher
      if (!hasPermission(user.role, Role.DEVELOPER)) {
        return AppError.forbidden(
          `${user.name || user.email} must have the DEVELOPER role or higher to be verified as a developer. Current role: ${user.role}`,
        )
      }

      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: emulatorId },
        select: userIdNameSelect,
      })

      if (!emulator) return ResourceError.emulator.notFound()

      const existing = await ctx.prisma.verifiedDeveloper.findUnique({
        where: { userId_emulatorId: { userId, emulatorId } },
      })

      if (existing) {
        return AppError.conflict(
          `${user.name || user.email} is already a verified developer for ${emulator.name}`,
        )
      }

      return await ctx.prisma.verifiedDeveloper.create({
        data: { userId, emulatorId, verifiedBy: verifierId, notes },
        include: {
          user: {
            select: userSelect(['id', 'name', 'email', 'profileImage', 'role']),
          },
          emulator: { select: emulatorBasicSelect },
        },
      })
    }),

  removeVerifiedDeveloper: manageEmulatorVerifiedDevelopersProcedure
    .input(RemoveVerifiedDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: { id: input.id },
        include: {
          user: { select: userSelect(['name', 'email']) },
          emulator: { select: userSelect(['name']) },
        },
      })

      if (!verifiedDeveloper) return ResourceError.verifiedDeveloper.notFound()

      await ctx.prisma.verifiedDeveloper.delete({ where: { id: input.id } })

      return {
        message: `Removed ${verifiedDeveloper.user.name || verifiedDeveloper.user.email} as verified developer for ${verifiedDeveloper.emulator.name}`,
      }
    }),

  isVerifiedDeveloper: protectedProcedure
    .input(IsVerifiedDeveloperSchema)
    .query(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: input.userId,
            emulatorId: input.emulatorId,
          },
        },
      })

      return !!verifiedDeveloper
    }),

  getMyVerifiedEmulators: protectedProcedure.query(async ({ ctx }) => {
    const verifiedDevelopers = await ctx.prisma.verifiedDeveloper.findMany({
      where: { userId: ctx.session.user.id },
      include: { emulator: { select: emulatorBasicSelect } },
      orderBy: { verifiedAt: 'desc' },
    })

    return verifiedDevelopers.map((vd) => vd.emulator)
  }),

  updateVerifiedDeveloper: manageEmulatorVerifiedDevelopersProcedure
    .input(UpdateVerifiedDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, emulatorId, notes } = input

      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: { id },
        include: {
          user: { select: userSelect(['id', 'name', 'email', 'role']) },
        },
      })

      if (!verifiedDeveloper) return ResourceError.verifiedDeveloper.notFound()

      // Re-check user role when updating (in case their role was downgraded)
      if (!hasPermission(verifiedDeveloper.user.role, Role.DEVELOPER)) {
        return AppError.forbidden(
          `${verifiedDeveloper.user.name || verifiedDeveloper.user.email} no longer has the DEVELOPER role or higher. Current role: ${verifiedDeveloper.user.role}`,
        )
      }

      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: emulatorId },
        select: userIdNameSelect,
      })

      if (!emulator) return ResourceError.emulator.notFound()

      // Check if this would create a duplicate (different emulator for same user)
      if (emulatorId !== verifiedDeveloper.emulatorId) {
        const existing = await ctx.prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: { userId: verifiedDeveloper.userId, emulatorId },
          },
        })

        if (existing) {
          return AppError.conflict(
            `${verifiedDeveloper.user.name || verifiedDeveloper.user.email} is already a verified developer for ${emulator.name}`,
          )
        }
      }

      const updated = await ctx.prisma.verifiedDeveloper.update({
        where: { id },
        data: { emulatorId, notes },
        include: {
          user: {
            select: userSelect(['id', 'name', 'email', 'profileImage', 'role']),
          },
          emulator: { select: emulatorBasicSelect },
          verifier: { select: userSelect(['id', 'name', 'email']) },
        },
      })

      return {
        message: 'Verified developer updated successfully',
        verifiedDeveloper: updated,
      }
    }),
})
