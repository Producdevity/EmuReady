import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";

export const devicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, limit } = input || {};
      
      return ctx.prisma.device.findMany({
        where: search ? {
          OR: [
            { brand: { contains: search } },
            { modelName: { contains: search } },
          ],
        } : undefined,
        take: limit,
        orderBy: [
          { brand: "asc" },
          { modelName: "asc" },
        ],
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.id },
      });
      
      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found",
        });
      }
      
      return device;
    }),

  create: adminProcedure
    .input(
      z.object({
        brand: z.string().min(1),
        modelName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.device.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        brand: z.string().min(1),
        modelName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const device = await ctx.prisma.device.findUnique({
        where: { id },
      });
      
      if (!device) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device not found",
        });
      }
      
      return ctx.prisma.device.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if device is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { deviceId: input.id },
      });
      
      if (listingsCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete device that is used in ${listingsCount} listings`,
        });
      }
      
      return ctx.prisma.device.delete({
        where: { id: input.id },
      });
    }),
}); 