'use client'

import { cn } from '@/lib/utils'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { severityBadgeVariant, severityIconConfig } from './AuthorRiskIndicator'
import { Badge } from './Badge'

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
  className?: string
}

const severityBorderConfig: Record<Severity, string> = {
  high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  medium: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
  low: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
}

// TODO: consider abstracting these 30~ lines of duplicated lines across multiple files
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
      if (!max || SEVERITY_ORDER[signal.severity] > SEVERITY_ORDER[max]) max = signal.severity
    }
  }

  return max
}

export function ReviewRiskWarningBanner(props: Props) {
  const groups = getRiskGroups(props)
  const severity = getHighestSeverity(groups)
  if (!severity) return null

  const config = severityIconConfig[severity]
  const Icon = config.icon

  return (
    <div className={cn('border rounded-lg p-4', severityBorderConfig[severity], props.className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.className)} />
        <div className="flex-1 space-y-3">
          <h4 className="text-sm font-medium">Review Risk Warning</h4>
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {group.title}
              </div>
              {group.signals.map((signal, index) => (
                <div
                  key={`${group.title}-${index}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1"
                >
                  <Badge
                    variant={severityBadgeVariant[signal.severity]}
                    size="sm"
                    className="shrink-0"
                  >
                    {signal.severity}
                  </Badge>
                  <span className="text-sm font-medium shrink-0">{signal.label}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {signal.description}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Review this listing carefully before making a decision.
          </p>
        </div>
      </div>
    </div>
  )
}
