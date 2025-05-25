import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import {
  GetSystemsSchema,
  GetSystemByIdSchema,
  CreateSystemSchema,
  UpdateSystemSchema,
  DeleteSystemSchema,
} from '@/schemas/system'

export const systemsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSystemsSchema).query(async ({ ctx, input }) => {
    const { search } = input ?? {}

    return await ctx.prisma.system.findMany({
      where: search
        ? {
            name: { contains: search },
          }
        : undefined,
      include: {
        _count: {
          select: {
            games: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
  }),

  byId: publicProcedure
    .input(GetSystemByIdSchema)
    .query(async ({ ctx, input }) => {
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.id },
        include: {
          games: {
            orderBy: {
              title: 'asc',
            },
          },
          _count: {
            select: {
              games: true,
            },
          },
        },
      })

      if (!system) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'System not found',
        })
      }

      return system
    }),

  create: adminProcedure
    .input(CreateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.system.findUnique({
        where: { name: input.name },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'System with this name already exists',
        })
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'System not found',
        })
      }

      if (name !== system.name) {
        const existing = await ctx.prisma.system.findUnique({
          where: { name },
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'System with this name already exists',
          })
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete system that has ${gamesCount} games`,
        })
      }

      return ctx.prisma.system.delete({
        where: { id: input.id },
      })
    }),
})
