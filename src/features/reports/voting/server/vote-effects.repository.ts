import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { TrustAction } from '@orm'

export class VoteEffectsRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async isFirstRecordedVote(userId: string): Promise<boolean> {
    const actions = await this.prisma.trustActionLog.findMany({
      where: { userId, action: { in: [TrustAction.UPVOTE, TrustAction.DOWNVOTE] } },
      select: { id: true },
      take: 2,
    })
    return actions.length === 1
  }
}
