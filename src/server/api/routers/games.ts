import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Prisma } from '@orm'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  authorProcedure,
} from '@/server/api/trpc'

export const gamesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          systemId: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { systemId, search, limit = 100, offset = 0 } = input ?? {}

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

      // For empty search with offset 0, we can optimize by returning fewer results initially
      const effectiveLimit =
        !search && offset === 0 ? Math.min(limit, 50) : limit

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
        orderBy: {
          title: 'asc',
        },
        skip: offset,
        take: effectiveLimit,
      })

      const games = await gamesQuery

      return {
        games,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          offset,
          limit: effectiveLimit,
        },
      }
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          system: true,
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

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      return game
    }),

  create: authorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        systemId: z.string(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if system exists
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.systemId },
      })

      if (!system) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'System not found',
        })
      }

      return ctx.prisma.game.create({
        data: input,
        include: {
          system: true,
        },
      })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        systemId: z.string(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if game exists
      const game = await ctx.prisma.game.findUnique({
        where: { id },
      })

      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check if system exists
      const system = await ctx.prisma.system.findUnique({
        where: { id: data.systemId },
      })

      if (!system) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'System not found',
        })
      }

      return ctx.prisma.game.update({
        where: { id },
        data,
        include: {
          system: true,
        },
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if game is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { gameId: input.id },
      })

      if (listingsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete game that is used in ${listingsCount} listings`,
        })
      }

      return ctx.prisma.game.delete({
        where: { id: input.id },
      })
    }),
})
