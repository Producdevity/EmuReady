import { PrismaRepository } from '@/server/persistence/prisma.repository'
import { TrustScoreRepository } from '@/server/repositories/trust-score.repository'
import { type Prisma } from '@orm'
import { statusContributionWhere } from './persistence/approval-trust.prisma'
import { type ApprovalTrustInput } from '../shared/approval-trust.types'

export class ApprovalTrustRepository extends PrismaRepository {
  private readonly scores: TrustScoreRepository

  constructor(transaction: Prisma.TransactionClient) {
    super(transaction)
    this.scores = new TrustScoreRepository(transaction)
  }

  async statusContribution(
    authorId: string,
    target: Pick<ApprovalTrustInput, 'reportId' | 'reportType'>,
  ): Promise<number> {
    const result = await this.prisma.trustActionLog.aggregate({
      where: statusContributionWhere(authorId, target),
      _sum: { weight: true },
    })
    return result._sum.weight ?? 0
  }

  async appendReconciliation(
    authorId: string,
    entries: Omit<Prisma.TrustActionLogCreateManyInput, 'userId'>[],
  ): Promise<number> {
    const result = await this.scores.appendActions(authorId, entries)
    return result.newScore
  }
}
