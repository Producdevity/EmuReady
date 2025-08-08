import { CheckCircle, Clock, XCircle, HelpCircle, type LucideIcon } from 'lucide-react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getApprovalStatusVariant } from '@/utils/badgeColors'
import { ApprovalStatus } from '@orm'

type Status = {
  icon: LucideIcon
  colorClass: string
  tooltip: string
}

const statusMap: Record<ApprovalStatus | 'UNKNOWN', Status> = {
  [ApprovalStatus.APPROVED]: {
    icon: CheckCircle,
    colorClass: 'text-green-600 dark:text-green-400',
    tooltip: 'Approved',
  },
  [ApprovalStatus.REJECTED]: {
    icon: XCircle,
    colorClass: 'text-red-600 dark:text-red-400',
    tooltip: 'Rejected',
  },
  [ApprovalStatus.PENDING]: {
    icon: Clock,
    colorClass: 'text-amber-600 dark:text-amber-400',
    tooltip: 'Under Review',
  },
  UNKNOWN: {
    icon: HelpCircle,
    colorClass: 'text-gray-600 dark:text-gray-400',
    tooltip: 'Unknown Status',
  },
}

interface Props {
  status: ApprovalStatus
  className?: string
}

export function ApprovalStatusBadge(props: Props) {
  const statusConfig = statusMap[props.status] || statusMap.UNKNOWN
  const IconComponent = statusConfig.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex cursor-pointer', props.className)}>
          <Badge pill variant={getApprovalStatusVariant(props.status)}>
            <IconComponent className={cn('w-4 h-4', statusConfig.colorClass)} />
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>{statusConfig.tooltip}</TooltipContent>
    </Tooltip>
  )
}
