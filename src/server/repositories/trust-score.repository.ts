import { ResourceError } from '@/lib/errors'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { type Prisma } from '@orm'

export class TrustScoreRepository extends PrismaWriteRepository<string> {
  constructor(transaction: Prisma.TransactionClient) {
    super(transaction)
  }

  findAdjustmentTarget(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  }

  findAdjustmentTargets(userIds: string[]) {
    return this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })
  }

  findAdministrator(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
  }

  private incrementScore(userId: string, delta: number) {
    return this.executeWrite(async () => {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { trustScore: { increment: delta }, lastActiveAt: new Date() },
        select: { trustScore: true },
      })
      return { oldScore: user.trustScore - delta, newScore: user.trustScore, delta }
    }, userId)
  }

  appendAction(entry: Prisma.TrustActionLogCreateManyInput) {
    return this.executeWrite(async () => {
      const scores = await this.incrementScore(entry.userId, entry.weight)
      await this.prisma.trustActionLog.create({ data: entry })
      return { ...scores, userId: entry.userId, action: entry.action }
    }, entry.userId)
  }

  async appendBulkActions(entries: Prisma.TrustActionLogCreateManyInput[]) {
    const changes = []
    for (const entry of entries) {
      const scores = await this.incrementScore(entry.userId, entry.weight)
      changes.push({ ...scores, userId: entry.userId, action: entry.action })
    }
    await this.prisma.trustActionLog.createMany({ data: entries })
    return changes
  }

  appendActions(userId: string, entries: Omit<Prisma.TrustActionLogCreateManyInput, 'userId'>[]) {
    return this.executeWrite(async () => {
      const delta = entries.reduce((total, entry) => total + entry.weight, 0)
      const scores = await this.incrementScore(userId, delta)
      await this.prisma.trustActionLog.createMany({
        data: entries.map((entry) => ({ ...entry, userId })),
      })
      return scores
    }, userId)
  }

  protected translateWriteError(error: unknown, userId: string): never {
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
      return ResourceError.user.notInDatabase(userId)
    }
    throw error
  }
}
