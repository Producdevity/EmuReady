import { createGpuService } from '@/features/hardware/gpu/server/gpu.service'
import {
  GetGpuByIdSchema,
  MobileGetGpusSchema,
  MobileGpuListItemSchema,
  MobileGpuListResponseSchema,
} from '@/features/hardware/gpu/shared/gpu.schemas'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'

export const mobileGpusRouter = createMobileTRPCRouter({
  /**
   * Get GPUs with search, filtering, and pagination.
   */
  get: mobilePublicProcedure
    .input(MobileGetGpusSchema)
    .output(MobileGpuListResponseSchema)
    .query(async ({ ctx, input }) => createGpuService(ctx.prisma).listMobileCompatibility(input)),

  /**
   * Get GPU by ID.
   */
  getById: mobilePublicProcedure
    .input(GetGpuByIdSchema)
    .output(MobileGpuListItemSchema)
    .query(async ({ ctx, input }) =>
      createGpuService(ctx.prisma).byIdMobileCompatibility(input.id),
    ),
})
