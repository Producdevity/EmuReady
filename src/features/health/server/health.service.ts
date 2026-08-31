import { HealthRepository } from './health.repository'
import type { PrismaRepositoryClient } from '@/server/persistence/prisma.repository'

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async checkDatabase(): Promise<void> {
    await this.repository.checkDatabase()
  }
}

export function createHealthService(prisma: PrismaRepositoryClient): HealthService {
  return new HealthService(new HealthRepository(prisma))
}
