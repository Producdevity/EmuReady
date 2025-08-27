import { ResourceError } from '@/lib/errors'
import { GetCpusSchema, GetCpuByIdSchema } from '@/schemas/cpu'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { CpusRepository } from '@/server/repositories/cpus.repository'

export const mobileCpusRouter = createMobileTRPCRouter({
  /**
   * Get CPUs with search, filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    return repository.list(input ?? {}, { limited: true })
  }),

  /**
   * Get CPU by ID
   */
  getById: mobilePublicProcedure.input(GetCpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    const cpu = await repository.byIdWithCounts(input.id, { limited: true })
    return cpu || ResourceError.cpu.notFound()
  }),
})
