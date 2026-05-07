import { applyTrustAction } from '@/lib/trust/service'
import { type TrustAction } from '@orm'

type ApplyTrustActionContext = NonNullable<Parameters<typeof applyTrustAction>[0]['context']>

interface BulkTrustActionTarget {
  authorId: string | null
}

export async function applyBulkTrustActions<T extends BulkTrustActionTarget>(args: {
  listings: T[]
  action: TrustAction
  buildContext: (listing: T & { authorId: string }) => ApplyTrustActionContext
}): Promise<void> {
  const withAuthor = args.listings.filter((l): l is T & { authorId: string } => l.authorId !== null)
  await Promise.all(
    withAuthor.map((listing) =>
      applyTrustAction({
        userId: listing.authorId,
        action: args.action,
        context: args.buildContext(listing),
      }),
    ),
  )
}
