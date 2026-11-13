import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'

export class VoteEffectsRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async countUserVotes(userId: string): Promise<number> {
    const [handheldVotes, pcVotes] = await Promise.all([
      this.prisma.vote.count({ where: { userId } }),
      this.prisma.pcListingVote.count({ where: { userId } }),
    ])
    return handheldVotes + pcVotes
  }
}
