'use client'

import { cn } from '@/lib/utils'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { severityBadgeVariant, severityIconConfig } from './AuthorRiskIndicator'
import { Badge } from './Badge'

const severityBorderConfig: Record<Severity, string> = {
  high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  medium: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
  low: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
}

interface Props {
  riskProfile: AuthorRiskProfile | null | undefined
  className?: string
}

export function AuthorRiskWarningBanner(props: Props) {
  if (!props.riskProfile || props.riskProfile.signals.length === 0) return null

  const severity = props.riskProfile.highestSeverity
  if (!severity) return null

  const config = severityIconConfig[severity]
  const Icon = config.icon

  return (
    <div className={cn('border rounded-lg p-4', severityBorderConfig[severity], props.className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.className)} />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium">Author Risk Warning</h4>
          {props.riskProfile.signals.map((signal, index) => (
            <div key={index} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge variant={severityBadgeVariant[signal.severity]} size="sm" className="shrink-0">
                {signal.severity}
              </Badge>
              <span className="text-sm font-medium shrink-0">{signal.label}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{signal.description}</span>
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
