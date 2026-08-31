import { PrismaRepository } from '@/server/persistence/prisma.repository'
import type { PrismaClient } from '@orm/client'

const DATABASE_CHECK_TIMEOUT_MS = 5_000

export class HealthRepository extends PrismaRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async checkDatabase(): Promise<void> {
    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`SELECT set_config('statement_timeout', ${String(DATABASE_CHECK_TIMEOUT_MS)}, true)`
        await transaction.$queryRaw`SELECT 1`
      },
      {
        maxWait: DATABASE_CHECK_TIMEOUT_MS,
        timeout: DATABASE_CHECK_TIMEOUT_MS,
      },
    )
  }
}
