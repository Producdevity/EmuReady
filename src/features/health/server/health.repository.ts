import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'

export class HealthRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
