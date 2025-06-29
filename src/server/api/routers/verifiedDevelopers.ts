import { z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import {
  IsVerifiedDeveloperSchema,
  RemoveVerifiedDeveloperSchema,
  VerifyDeveloperSchema,
} from '@/schemas/verifiedDeveloper'
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/server/api/trpc'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import type { Prisma } from '@orm'

export const verifiedDevelopersRouter = createTRPCRouter({
  getVerifiedDevelopers: adminProcedure
    .input(
      z
        .object({
          emulatorId: z.string().optional(),
          userId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          page: z.number().min(1).default(1),
          search: z.string().optional(),
          emulatorFilter: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { emulatorId, userId, limit, page, search, emulatorFilter } =
        input ?? {}
      const actualLimit = limit ?? 50
      const actualPage = page ?? 1
      const skip = (actualPage - 1) * actualLimit

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
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
          {
            emulator: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
          {
            notes: { contains: searchTerm, mode: 'insensitive' },
          },
        ]
      }

      const [verifiedDevelopers, total] = await Promise.all([
        ctx.prisma.verifiedDeveloper.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
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
        select: { id: true, name: true, email: true, role: true },
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
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
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

  updateVerifiedDeveloper: adminProcedure
    .input(
      z.object({
        id: z.string(),
        emulatorId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, emulatorId, notes } = input

      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      })

      if (!verifiedDeveloper) {
        return AppError.notFound('Verified developer record not found')
      }

      // Re-check user role when updating (in case their role was downgraded)
      if (!hasPermission(verifiedDeveloper.user.role, Role.DEVELOPER)) {
        return AppError.forbidden(
          `${verifiedDeveloper.user.name || verifiedDeveloper.user.email} no longer has the DEVELOPER role or higher. Current role: ${verifiedDeveloper.user.role}`,
        )
      }

      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: emulatorId },
        select: { id: true, name: true },
      })

      if (!emulator) return ResourceError.emulator.notFound()

      // Check if this would create a duplicate (different emulator for same user)
      if (emulatorId !== verifiedDeveloper.emulatorId) {
        const existing = await ctx.prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: verifiedDeveloper.userId,
              emulatorId,
            },
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
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
          emulator: { select: { id: true, name: true, logo: true } },
          verifier: { select: { id: true, name: true, email: true } },
        },
      })

      return {
        message: 'Verified developer updated successfully',
        verifiedDeveloper: updated,
      }
    }),
})
