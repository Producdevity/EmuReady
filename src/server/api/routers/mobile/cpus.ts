import { createCpuService } from '@/features/hardware/cpu/server/cpu.service'
import {
  GetCpuByIdSchema,
  MobileCpuListItemSchema,
  MobileCpuListResponseSchema,
  MobileGetCpusSchema,
} from '@/features/hardware/cpu/shared/cpu.schemas'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'

export const mobileCpusRouter = createMobileTRPCRouter({
  /**
   * Get CPUs with search, filtering, and pagination.
   */
  get: mobilePublicProcedure
    .input(MobileGetCpusSchema)
    .output(MobileCpuListResponseSchema)
    .query(async ({ ctx, input }) => createCpuService(ctx.prisma).listMobileCompatibility(input)),

  /**
   * Get CPU by ID.
   */
  getById: mobilePublicProcedure
    .input(GetCpuByIdSchema)
    .output(MobileCpuListItemSchema)
    .query(async ({ ctx, input }) =>
      createCpuService(ctx.prisma).byIdMobileCompatibility(input.id),
    ),
})
