import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  authorProcedure,
} from "@/server/api/trpc";

export const gamesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        systemId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { systemId, search, limit = 50, offset = 0 } = input || {};
      
      // Build where clause
      const where = {
        ...(systemId ? { systemId } : {}),
        ...(search ? { title: { contains: search } } : {}),
      };
      
      // Count total
      const total = await ctx.prisma.game.count({ where });
      
      // Get games
      const games = await ctx.prisma.game.findMany({
        where,
        include: {
          system: true,
          _count: {
            select: {
              listings: true,
            },
          },
        },
        orderBy: {
          title: "asc",
        },
        skip: offset,
        take: limit,
      });
      
      return {
        games,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          offset,
          limit,
        },
      };
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
              device: true,
              emulator: true,
              performance: true,
              _count: {
                select: {
                  votes: true,
                  comments: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
      
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      
      return game;
    }),

  create: authorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        systemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if system exists
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.systemId },
      });
      
      if (!system) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "System not found",
        });
      }
      
      return ctx.prisma.game.create({
        data: input,
        include: {
          system: true,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        systemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Check if game exists
      const game = await ctx.prisma.game.findUnique({
        where: { id },
      });
      
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      
      // Check if system exists
      const system = await ctx.prisma.system.findUnique({
        where: { id: data.systemId },
      });
      
      if (!system) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "System not found",
        });
      }
      
      return ctx.prisma.game.update({
        where: { id },
        data,
        include: {
          system: true,
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if game is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { gameId: input.id },
      });
      
      if (listingsCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete game that is used in ${listingsCount} listings`,
        });
      }
      
      return ctx.prisma.game.delete({
        where: { id: input.id },
      });
    }),
}); 