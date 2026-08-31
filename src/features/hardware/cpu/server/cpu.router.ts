import { MutationSuccessSchema } from '@/schemas/common'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { createActorFromSession } from '@/server/auth/actor'
import { createCpuService } from './cpu.service'
import {
  CreateCpuSchema,
  DeleteCpuSchema,
  GetCpuByIdSchema,
  GetCpuOptionsSchema,
  GetCpusByIdsSchema,
  GetCpusSchema,
  CpuDetailSchema,
  CpuListResponseSchema,
  CpuOptionsResponseSchema,
  CpuStatsSchema,
  CpusByIdsResponseSchema,
  UpdateCpuSchema,
} from '../shared/cpu.schemas'

export const cpuRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetCpusSchema)
    .output(CpuListResponseSchema)
    .query(async ({ ctx, input }) => createCpuService(ctx.prisma).list(input ?? {})),

  options: publicProcedure
    .input(GetCpuOptionsSchema)
    .output(CpuOptionsResponseSchema)
    .query(async ({ ctx, input }) => createCpuService(ctx.prisma).options(input ?? {})),

  byId: publicProcedure
    .input(GetCpuByIdSchema)
    .output(CpuDetailSchema)
    .query(async ({ ctx, input }) => createCpuService(ctx.prisma).byId(input.id)),

  getByIds: publicProcedure
    .input(GetCpusByIdsSchema)
    .output(CpusByIdsResponseSchema)
    .query(async ({ ctx, input }) => createCpuService(ctx.prisma).listByIds(input)),

  create: protectedProcedure
    .input(CreateCpuSchema)
    .output(CpuDetailSchema)
    .mutation(async ({ ctx, input }) =>
      createCpuService(ctx.prisma).create(createActorFromSession(ctx.session), input),
    ),

  update: protectedProcedure
    .input(UpdateCpuSchema)
    .output(CpuDetailSchema)
    .mutation(async ({ ctx, input }) =>
      createCpuService(ctx.prisma).update(createActorFromSession(ctx.session), input),
    ),

  delete: protectedProcedure
    .input(DeleteCpuSchema)
    .output(MutationSuccessSchema)
    .mutation(async ({ ctx, input }) =>
      createCpuService(ctx.prisma).delete(createActorFromSession(ctx.session), input),
    ),

  stats: protectedProcedure
    .output(CpuStatsSchema)
    .query(async ({ ctx }) =>
      createCpuService(ctx.prisma).stats(createActorFromSession(ctx.session)),
    ),
})
