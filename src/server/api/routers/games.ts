import type { Prisma } from '@orm'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  authorProcedure,
} from '@/server/api/trpc'
import { ResourceError } from '@/lib/errors'
import {
  GetGamesSchema,
  GetGameByIdSchema,
  CreateGameSchema,
  UpdateGameSchema,
  DeleteGameSchema,
} from '@/schemas/game'

export const gamesRouter = createTRPCRouter({
  get: publicProcedure.input(GetGamesSchema).query(async ({ ctx, input }) => {
    const {
      systemId,
      search,
      limit = 100,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Calculate offset from page if provided
    const actualOffset = page ? (page - 1) * limit : offset

    // Build where clause with optimized search pattern
    let where: Prisma.GameWhereInput = {
      ...(systemId ? { systemId } : {}),
    }

    // Add optimized search with case insensitivity and performance optimizations
    if (search && search.trim() !== '') {
      const searchTerm = search.trim()

      // For multi-word searches, we need a different approach to ensure good matches
      if (searchTerm.includes(' ')) {
        // First, try to match the exact phrase
        where = {
          ...where,
          OR: [
            // Option 1: Full exact phrase match
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            // Option 2: Match all words in any order (most flexible)
            {
              AND: searchTerm
                .split(/\s+/)
                .filter((word) => word.length >= 2)
                .map((word) => ({
                  title: {
                    contains: word,
                    mode: 'insensitive',
                  },
                })),
            },
          ],
        }
      } else {
        // For single words, a simple contains is sufficient
        where = {
          ...where,
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        }
      }
    }

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.GameOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'title':
          orderBy.push({ title: sortDirection })
          break
        case 'system.name':
          orderBy.push({ system: { name: sortDirection } })
          break
        case 'listingsCount':
          orderBy.push({ listings: { _count: sortDirection } })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ title: 'asc' })
    }

    // For empty search with offset 0, we can optimize by returning fewer results initially
    const effectiveLimit =
      !search && actualOffset === 0 ? Math.min(limit, 50) : limit

    // Always run count query for consistent pagination
    const total = await ctx.prisma.game.count({ where })

    // Get games with optimized query - only include essential fields for performance
    const gamesQuery = ctx.prisma.game.findMany({
      where,
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
        system: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            listings: true,
          },
        },
      },
      orderBy,
      skip: actualOffset,
      take: effectiveLimit,
    })

    const games = await gamesQuery

    return {
      games,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: page ?? Math.floor(actualOffset / limit) + 1,
        offset: actualOffset,
        limit: effectiveLimit,
      },
    }
  }),

  byId: publicProcedure
    .input(GetGameByIdSchema)
    .query(async ({ ctx, input }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          system: {
            include: {
              emulators: true,
            },
          },
          listings: {
            include: {
              device: {
                include: {
                  brand: true,
                },
              },
              emulator: true,
              performance: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  votes: true,
                  comments: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (!game) ResourceError.game.notFound()

      return game
    }),

  create: authorProcedure
    .input(CreateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.systemId },
      })

      if (!system) ResourceError.system.notFound()

      // Check if game with same title already exists for this system
      const existingGame = await ctx.prisma.game.findFirst({
        where: {
          title: input.title,
          systemId: input.systemId,
        },
      })

      if (existingGame) {
        ResourceError.game.alreadyExists(input.title, system!.name)
      }

      try {
        return await ctx.prisma.game.create({
          data: input,
          include: { system: true },
        })
      } catch (error) {
        // Fallback error handling for rare race conditions
        if (error instanceof PrismaClientKnownRequestError) {
          // P2002 is the error code for unique constraint violations
          if (error.code === 'P2002') {
            ResourceError.game.alreadyExists(input.title, system!.name)
          }
        }
        // Re-throw any other errors
        throw error
      }
    }),

  update: adminProcedure
    .input(UpdateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const game = await ctx.prisma.game.findUnique({ where: { id } })

      if (!game) ResourceError.game.notFound()

      const system = await ctx.prisma.system.findUnique({
        where: { id: data.systemId },
      })

      if (!system) ResourceError.system.notFound()

      return ctx.prisma.game.update({
        where: { id },
        data,
        include: { system: true },
      })
    }),

  delete: adminProcedure
    .input(DeleteGameSchema)
    .mutation(async ({ ctx, input }) => {
      const listingsCount = await ctx.prisma.listing.count({
        where: { gameId: input.id },
      })

      if (listingsCount > 0) ResourceError.game.inUse(listingsCount)

      return ctx.prisma.game.delete({ where: { id: input.id } })
    }),
})
