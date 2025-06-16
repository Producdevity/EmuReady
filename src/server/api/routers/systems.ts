import { ResourceError } from '@/lib/errors'
import {
  GetSystemsSchema,
  GetSystemByIdSchema,
  CreateSystemSchema,
  UpdateSystemSchema,
  DeleteSystemSchema,
} from '@/schemas/system'
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from '@/server/api/trpc'
import type { Prisma } from '@orm'

export const systemsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSystemsSchema).query(async ({ ctx, input }) => {
    const { search, sortField, sortDirection } = input ?? {}

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.SystemOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'name':
          orderBy.push({ name: sortDirection })
          break
        case 'gamesCount':
          orderBy.push({ games: { _count: sortDirection } })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ name: 'asc' })
    }

    return await ctx.prisma.system.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: { _count: { select: { games: true } } },
      orderBy,
    })
  }),

  byId: publicProcedure
    .input(GetSystemByIdSchema)
    .query(async ({ ctx, input }) => {
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.id },
        include: {
          games: { orderBy: { title: 'asc' } },
          _count: { select: { games: true } },
        },
      })

      if (!system) return ResourceError.system.notFound()

      return system
    }),

  create: adminProcedure
    .input(CreateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.system.findUnique({
        where: { name: input.name },
      })

      if (existing) {
        ResourceError.system.alreadyExists(input.name)
      }

      return ctx.prisma.system.create({
        data: input,
      })
    }),

  update: adminProcedure
    .input(UpdateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input

      const system = await ctx.prisma.system.findUnique({
        where: { id },
      })

      if (!system) {
        ResourceError.system.notFound()
      }

      if (name !== system?.name) {
        const existing = await ctx.prisma.system.findUnique({
          where: { name },
        })

        if (existing) {
          ResourceError.system.alreadyExists(name)
        }
      }

      return ctx.prisma.system.update({
        where: { id },
        data: { name },
      })
    }),

  delete: adminProcedure
    .input(DeleteSystemSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if system has games
      const gamesCount = await ctx.prisma.game.count({
        where: { systemId: input.id },
      })

      if (gamesCount > 0) {
        ResourceError.system.hasGames(gamesCount)
      }

      return ctx.prisma.system.delete({
        where: { id: input.id },
      })
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [total, withGames, withoutGames] = await Promise.all([
      ctx.prisma.system.count(),
      ctx.prisma.system.count({
        where: {
          games: {
            some: {},
          },
        },
      }),
      ctx.prisma.system.count({
        where: {
          games: {
            none: {},
          },
        },
      }),
    ])

    return {
      total,
      withGames,
      withoutGames,
    }
  }),
})
