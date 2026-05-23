import { ApprovalStatusBadge, LocalizedDate } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'
import { AdminUserLink } from './AdminUserLink'

type ModeratorInfo = NonNullable<RouterOutput['listings']['moderatorInfo']>

interface Props {
  approval: ModeratorInfo['approval']
}

export function ApprovalSection(props: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Approval</h4>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <ApprovalStatusBadge status={props.approval.status} />
        {props.approval.processedBy && (
          <span className="text-gray-600 dark:text-gray-400">
            by{' '}
            <AdminUserLink
              userId={props.approval.processedBy.id}
              name={props.approval.processedBy.name}
            />
          </span>
        )}
        {props.approval.processedAt && (
          <span className="text-gray-500 dark:text-gray-400">
            <LocalizedDate date={props.approval.processedAt} format="timeAgo" />
          </span>
        )}
      </div>
      {props.approval.processedNotes && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
          {props.approval.processedNotes}
        </p>
      )}
      {props.approval.status === ApprovalStatus.PENDING && (
        <p className="text-sm text-amber-600 dark:text-amber-400">Not yet reviewed</p>
      )}
    </div>
  )
}
