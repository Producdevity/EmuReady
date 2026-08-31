import { HealthRepository } from './health.repository'
import type { PrismaClient } from '@orm/client'

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async checkDatabase(): Promise<void> {
    await this.repository.checkDatabase()
  }
}

export function createHealthService(prisma: PrismaClient): HealthService {
  return new HealthService(new HealthRepository(prisma))
}
