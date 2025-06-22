import { AppError, ResourceError } from '@/lib/errors'
import {
  GetVerifiedDevelopersSchema,
  IsVerifiedDeveloperSchema,
  RemoveVerifiedDeveloperSchema,
  VerifyDeveloperSchema,
} from '@/schemas/verifiedDeveloper'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../trpc'

export const verifiedDevelopersRouter = createTRPCRouter({
  getVerifiedDevelopers: adminProcedure
    .input(GetVerifiedDevelopersSchema)
    .query(async ({ ctx, input }) => {
      const { emulatorId, userId, limit, page } = input ?? {}
      const actualLimit = limit ?? 50
      const actualPage = page ?? 1
      const skip = (actualPage - 1) * actualLimit

      const where = {
        ...(emulatorId && { emulatorId }),
        ...(userId && { userId }),
      }

      const [verifiedDevelopers, total] = await Promise.all([
        ctx.prisma.verifiedDeveloper.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
            emulator: { select: { id: true, name: true, logo: true } },
            verifier: { select: { id: true, name: true, email: true } },
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

  verifyDeveloper: adminProcedure
    .input(VerifyDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, emulatorId, notes } = input
      const verifierId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) return ResourceError.user.notFound()

      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: emulatorId },
        select: { id: true, name: true },
      })

      if (!emulator) return ResourceError.emulator.notFound()

      const existing = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId,
            emulatorId,
          },
        },
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
            select: { id: true, name: true, email: true, profileImage: true },
          },
          emulator: { select: { id: true, name: true, logo: true } },
        },
      })
    }),

  removeVerifiedDeveloper: adminProcedure
    .input(RemoveVerifiedDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { name: true, email: true } },
          emulator: { select: { name: true } },
        },
      })

      if (!verifiedDeveloper) {
        return AppError.notFound('Verified developer record not found')
      }

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
      include: { emulator: { select: { id: true, name: true, logo: true } } },
      orderBy: { verifiedAt: 'desc' },
    })

    return verifiedDevelopers.map((vd) => vd.emulator)
  }),
})
