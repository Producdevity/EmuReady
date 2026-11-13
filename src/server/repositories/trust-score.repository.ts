import { ResourceError } from '@/lib/errors'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { type Prisma } from '@orm'

export class TrustScoreRepository extends PrismaWriteRepository<string> {
  constructor(transaction: Prisma.TransactionClient) {
    super(transaction)
  }

  appendActions(userId: string, entries: Omit<Prisma.TrustActionLogCreateManyInput, 'userId'>[]) {
    return this.executeWrite(async () => {
      const delta = entries.reduce((total, entry) => total + entry.weight, 0)
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { trustScore: { increment: delta }, lastActiveAt: new Date() },
        select: { trustScore: true },
      })
      await this.prisma.trustActionLog.createMany({
        data: entries.map((entry) => ({ ...entry, userId })),
      })
      return { oldScore: user.trustScore - delta, newScore: user.trustScore, delta }
    }, userId)
  }

  protected translateWriteError(error: unknown, userId: string): never {
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
      return ResourceError.user.notInDatabase(userId)
    }
    throw error
  }
}
