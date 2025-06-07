import { ApprovalStatus } from '@orm'

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus
  type?: 'listing' | 'game'
  className?: string
}

function getStatusConfig(
  status: ApprovalStatus,
  type: 'listing' | 'game' = 'listing',
) {
  switch (status) {
    case ApprovalStatus.APPROVED:
      return {
        variant:
          'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
        label: 'Approved',
      }
    case ApprovalStatus.REJECTED:
      return {
        variant: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
        label: 'Rejected',
      }
    case ApprovalStatus.PENDING:
      return {
        variant:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
        label: type === 'game' ? 'Pending Approval' : 'Pending',
      }
    default:
      return {
        variant:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
        label: 'Unknown',
      }
  }
}

function ApprovalStatusBadge(props: ApprovalStatusBadgeProps) {
  const config = getStatusConfig(props.status, props.type)

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.variant} ${props.className ?? ''}`}
    >
      {config.label}
    </span>
  )
}

export default ApprovalStatusBadge
