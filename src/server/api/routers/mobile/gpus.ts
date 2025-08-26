import { ResourceError } from '@/lib/errors'
import { GetGpusSchema, GetGpuByIdSchema } from '@/schemas/gpu'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { GpusRepository } from '@/server/repositories/gpus.repository'

export const mobileGpusRouter = createMobileTRPCRouter({
  /**
   * Get GPUs with search, filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetGpusSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    return repository.getPaginated(input ?? {}, { limited: true })
  }),

  /**
   * Get GPU by ID
   */
  getById: mobilePublicProcedure.input(GetGpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    const gpu = await repository.byIdWithCounts(input.id, { limited: true })
    return gpu || ResourceError.gpu.notFound()
  }),
})
