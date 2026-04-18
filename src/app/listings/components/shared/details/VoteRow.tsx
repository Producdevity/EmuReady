import { Badge, LocalizedDate, TrustLevelBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import { AdminUserLink } from './AdminUserLink'
import { VoteDirectionIcon } from './VoteDirectionIcon'

type ModeratorInfo = NonNullable<RouterOutput['listings']['moderatorInfo']>
export type VoteEntry = ModeratorInfo['votes'][number]

interface Props {
  vote: VoteEntry
}

export function VoteRow(props: Props) {
  const isNullified = props.vote.nullifiedAt !== null

  return (
    <tr
      className={cn('border-b border-gray-100 dark:border-gray-800', isNullified && 'opacity-60')}
    >
      <td className="py-2 pr-3">
        <VoteDirectionIcon value={props.vote.value} />
      </td>
      <td className="py-2 pr-3">
        <AdminUserLink userId={props.vote.user.id} name={props.vote.user.name} />
      </td>
      <td className="py-2 pr-3">
        <TrustLevelBadge trustScore={props.vote.user.trustScore} size="sm" />
      </td>
      <td className="py-2 pr-3 text-sm text-gray-500 dark:text-gray-400">
        <LocalizedDate date={props.vote.createdAt} format="timeAgo" />
      </td>
      <td className="py-2">
        {isNullified && (
          <Badge variant="warning" size="sm">
            Nullified
          </Badge>
        )}
      </td>
    </tr>
  )
}
