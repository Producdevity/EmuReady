import { withRetryTransaction } from '@/server/utils/transactions'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { Prisma, type PrismaClient } from '@orm/client'

export async function withTrustScoreTransaction<T>(
  prisma: PrismaClient,
  operation: (tx: Prisma.TransactionClient, trustChanges: TrustScoreChange[]) => Promise<T>,
): Promise<T> {
  const committed = await withRetryTransaction(
    prisma,
    async (tx) => {
      const trustChanges: TrustScoreChange[] = []
      const result = await operation(tx, trustChanges)
      return { result, trustChanges }
    },
    { timeout: 120_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
  for (const change of committed.trustChanges) trackTrustScoreChange(change)
  return committed.result
}
