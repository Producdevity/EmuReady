import { MutationSuccessSchema } from '@/schemas/common'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { createGpuService } from './gpu.service'
import {
  CreateGpuSchema,
  DeleteGpuSchema,
  GetGpuByIdSchema,
  GetGpuOptionsSchema,
  GetGpusByIdsSchema,
  GetGpusSchema,
  GpuDetailSchema,
  GpuListResponseSchema,
  GpuOptionsResponseSchema,
  GpuStatsSchema,
  GpusByIdsResponseSchema,
  UpdateGpuSchema,
} from '../shared/gpu.schemas'

export const gpuRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetGpusSchema)
    .output(GpuListResponseSchema)
    .query(async ({ ctx, input }) => createGpuService(ctx.prisma).list(input ?? {})),

  options: publicProcedure
    .input(GetGpuOptionsSchema)
    .output(GpuOptionsResponseSchema)
    .query(async ({ ctx, input }) => createGpuService(ctx.prisma).options(input ?? {})),

  byId: publicProcedure
    .input(GetGpuByIdSchema)
    .output(GpuDetailSchema)
    .query(async ({ ctx, input }) => createGpuService(ctx.prisma).byId(input.id)),

  getByIds: publicProcedure
    .input(GetGpusByIdsSchema)
    .output(GpusByIdsResponseSchema)
    .query(async ({ ctx, input }) => createGpuService(ctx.prisma).listByIds(input)),

  create: protectedProcedure
    .input(CreateGpuSchema)
    .output(GpuDetailSchema)
    .mutation(async ({ ctx, input }) =>
      createGpuService(ctx.prisma).create(createActorFromSession(ctx.session), input),
    ),

  update: protectedProcedure
    .input(UpdateGpuSchema)
    .output(GpuDetailSchema)
    .mutation(async ({ ctx, input }) =>
      createGpuService(ctx.prisma).update(createActorFromSession(ctx.session), input),
    ),

  delete: protectedProcedure
    .input(DeleteGpuSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) =>
      createGpuService(ctx.prisma).delete(createActorFromSession(ctx.session), input),
    ),

  stats: protectedProcedure
    .output(GpuStatsSchema)
    .query(async ({ ctx }) =>
      createGpuService(ctx.prisma).stats(createActorFromSession(ctx.session)),
    ),
})
