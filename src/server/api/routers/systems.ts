import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";

export const systemsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search } = input || {};
      
      const systems = await ctx.prisma.system.findMany({
        where: search ? {
          name: { contains: search },
        } : undefined,
        include: {
          _count: {
            select: {
              games: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
      
      return systems;
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.id },
        include: {
          games: {
            orderBy: {
              title: "asc",
            },
          },
          _count: {
            select: {
              games: true,
            },
          },
        },
      });
      
      if (!system) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "System not found",
        });
      }
      
      return system;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if system already exists
      const existing = await ctx.prisma.system.findUnique({
        where: { name: input.name },
      });
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "System with this name already exists",
        });
      }
      
      return ctx.prisma.system.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input;
      
      // Check if system exists
      const system = await ctx.prisma.system.findUnique({
        where: { id },
      });
      
      if (!system) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "System not found",
        });
      }
      
      // Check if name is already taken by another system
      if (name !== system.name) {
        const existing = await ctx.prisma.system.findUnique({
          where: { name },
        });
        
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "System with this name already exists",
          });
        }
      }
      
      return ctx.prisma.system.update({
        where: { id },
        data: { name },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if system has games
      const gamesCount = await ctx.prisma.game.count({
        where: { systemId: input.id },
      });
      
      if (gamesCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete system that has ${gamesCount} games`,
        });
      }
      
      return ctx.prisma.system.delete({
        where: { id: input.id },
      });
    }),
}); 