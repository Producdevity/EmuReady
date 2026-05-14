'use client'

import { cn } from '@/lib/utils'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { severityBadgeVariant, severityIconConfig } from './AuthorRiskIndicator'
import { Badge } from './Badge'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

interface RiskSignalForDisplay {
  severity: Severity
  label: string
  description: string
}

interface RiskGroupForDisplay {
  title: string
  signals: RiskSignalForDisplay[]
}

interface Props {
  authorRiskProfile: AuthorRiskProfile | null | undefined
  submissionRiskProfile: SubmissionRiskProfile | null | undefined
  size?: 'sm' | 'md'
  className?: string
  onInvestigate?: (authorId: string) => void
}

const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

function getRiskGroups(props: Props): RiskGroupForDisplay[] {
  const groups: RiskGroupForDisplay[] = []

  if (props.submissionRiskProfile && props.submissionRiskProfile.signals.length > 0) {
    groups.push({ title: 'Submission Risk', signals: props.submissionRiskProfile.signals })
  }

  if (props.authorRiskProfile && props.authorRiskProfile.signals.length > 0) {
    groups.push({ title: 'Author Risk', signals: props.authorRiskProfile.signals })
  }

  return groups
}

function getHighestSeverity(groups: RiskGroupForDisplay[]): Severity | null {
  let max: Severity | null = null

  for (const group of groups) {
    for (const signal of group.signals) {
      if (!max || SEVERITY_ORDER[signal.severity] > SEVERITY_ORDER[max]) {
        max = signal.severity
      }
    }
  }

  return max
}

function getSignalCount(groups: RiskGroupForDisplay[]): number {
  return groups.reduce((total, group) => total + group.signals.length, 0)
}

export function ReviewRiskIndicator(props: Props) {
  const groups = getRiskGroups(props)
  const severity = getHighestSeverity(groups)
  if (!severity) return null

  const config = severityIconConfig[severity]
  const Icon = config.icon
  const size = props.size ?? 'sm'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const isClickable = !!props.onInvestigate && !!props.authorRiskProfile
  const signalCount = getSignalCount(groups)

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
