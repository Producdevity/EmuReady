import type { Prisma, PrismaClient } from '@orm/client'

export type PrismaRepositoryClient = PrismaClient | Prisma.TransactionClient

export abstract class PrismaRepository {
  protected constructor(protected readonly prisma: PrismaRepositoryClient) {}
}

export abstract class PrismaWriteRepository<WriteContext> extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  protected async executeWrite<T>(operation: () => Promise<T>, context: WriteContext): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.translateWriteError(error, context)
    }
  }

  protected abstract translateWriteError(error: unknown, context: WriteContext): never
}
