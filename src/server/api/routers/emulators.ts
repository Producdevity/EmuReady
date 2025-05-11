import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";

export const emulatorsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search } = input || {};
      
      return ctx.prisma.emulator.findMany({
        where: search ? {
          name: { contains: search },
        } : undefined,
        include: {
          _count: {
            select: { listings: true },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { listings: true },
          },
        },
      });
      
      if (!emulator) {
        throw new TRPCError({
          code: "NOT_FOUND", 
          message: "Emulator not found",
        });
      }
      
      return emulator;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if emulator already exists
      const existing = await ctx.prisma.emulator.findUnique({
        where: { name: input.name },
      });
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Emulator with this name already exists",
        });
      }
      
      return ctx.prisma.emulator.create({
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
      
      // Check if emulator exists
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id },
      });
      
      if (!emulator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Emulator not found",
        });
      }
      
      // Check if name is already taken by another emulator
      if (name !== emulator.name) {
        const existing = await ctx.prisma.emulator.findUnique({
          where: { name },
        });
        
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Emulator with this name already exists",
          });
        }
      }
      
      return ctx.prisma.emulator.update({
        where: { id },
        data: { name },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if emulator is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { emulatorId: input.id },
      });
      
      if (listingsCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete emulator that is used in ${listingsCount} listings`,
        });
      }
      
      return ctx.prisma.emulator.delete({
        where: { id: input.id },
      });
    }),
}); 