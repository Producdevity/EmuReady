'use client'

import { cn } from '@/lib/utils'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { severityBadgeVariant, severityIconConfig } from './AuthorRiskIndicator'
import { Badge } from './Badge'
import {
  getHighestReviewRiskSeverity,
  getReviewRiskGroups,
  getReviewRiskSignalCount,
} from './reviewRiskDisplay'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

interface Props {
  authorRiskProfile: AuthorRiskProfile | null | undefined
  submissionRiskProfile: SubmissionRiskProfile | null | undefined
  size?: 'sm' | 'md'
  className?: string
  onInvestigate?: (authorId: string) => void
}

export function ReviewRiskIndicator(props: Props) {
  const groups = getReviewRiskGroups(props)
  const severity = getHighestReviewRiskSeverity(groups)
  if (!severity) return null

  const config = severityIconConfig[severity]
  const Icon = config.icon
  const size = props.size ?? 'sm'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const isClickable = !!props.onInvestigate && !!props.authorRiskProfile
  const signalCount = getReviewRiskSignalCount(groups)

  const handleClick = () => {
    if (props.onInvestigate && props.authorRiskProfile) {
      props.onInvestigate(props.authorRiskProfile.authorId)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center',
            isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-help',
            props.className,
          )}
          role={isClickable ? 'button' : 'status'}
          aria-label={`Review risk: ${severity} severity, ${signalCount} signal${signalCount > 1 ? 's' : ''}`}
          onClick={isClickable ? handleClick : undefined}
          onKeyDown={
            isClickable
              ? (ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    handleClick()
                  }
                }
              : undefined
          }
          tabIndex={isClickable ? 0 : undefined}
        >
          <Icon className={cn(iconSize, config.className)} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-3">
          <div className="font-semibold text-sm">Review Risk Signals</div>
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {group.title}
              </div>
              {group.signals.map((signal, index) => (
                <div key={`${group.title}-${index}`} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant={severityBadgeVariant[signal.severity]}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  >
                    {signal.severity}
                  </Badge>
                  <div className="min-w-0">
                    <span className="font-medium">{signal.label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {signal.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {isClickable && (
            <p className="text-xs text-blue-500 dark:text-blue-400 pt-1 border-t border-gray-200 dark:border-gray-600">
              Click to investigate author
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
