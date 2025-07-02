import { Shield, User } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'

interface VerificationData {
  id: string
  verifiedAt: Date | string
  notes?: string | null
  developer: {
    id: string
    name: string | null
  }
}

interface Props {
  verifications: VerificationData[]
  className?: string
  size?: 'sm' | 'md'
  showText?: boolean
  showTooltip?: boolean
}

export function ListingVerificationBadge(props: Props) {
  const size = props.size ?? 'md'
  const showText = props.showText ?? false
  const showTooltip = props.showTooltip ?? true

  if (!props.verifications || props.verifications.length === 0) return null

  const verificationCount = props.verifications.length
  const latestVerification = props.verifications[0]

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'text-xs' : 'text-sm',
        props.className,
      )}
    >
      <Shield
        className={cn(
          'text-green-500 dark:text-green-400',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
        )}
      />
      {showText && (
        <span className="text-green-600 dark:text-green-400 font-medium">
          Verified by Developer{verificationCount > 1 ? 's' : ''}
        </span>
      )}
      {verificationCount > 1 && (
        <span
          className={cn(
            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full px-1.5 py-0.5 font-bold',
            size === 'sm'
              ? 'text-xs min-w-[16px] h-4'
              : 'text-xs min-w-[18px] h-5',
          )}
        >
          {verificationCount}
        </span>
      )}
    </div>
  )

  if (!showTooltip) {
    return badgeContent
  }

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold">
        Verified by Developer{verificationCount > 1 ? 's' : ''}
      </div>
      {props.verifications.slice(0, 3).map((verification) => (
        <div key={verification.id} className="flex items-center gap-2 text-sm">
          <User className="w-3 h-3 text-gray-400" />
          <span>{verification.developer.name ?? 'Unknown Developer'}</span>
          <span className="text-gray-400">
            {formatDate(verification.verifiedAt)}
          </span>
        </div>
      ))}
      {verificationCount > 3 && (
        <div className="text-xs text-gray-400">
          +{verificationCount - 3} more verification
          {verificationCount - 3 > 1 ? 's' : ''}
        </div>
      )}
      {latestVerification.notes && (
        <div className="text-sm text-gray-600 dark:text-gray-300 border-t pt-2">
          &#34;{latestVerification.notes}&#34;
        </div>
      )}
    </div>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  )
}
