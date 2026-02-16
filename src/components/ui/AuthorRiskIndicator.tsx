'use client'

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { Badge, type BadgeVariant } from './Badge'
import { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip'

export const severityIconConfig: Record<Severity, { icon: typeof ShieldAlert; className: string }> =
  {
    high: { icon: ShieldAlert, className: 'text-red-500 dark:text-red-400' },
    medium: { icon: AlertTriangle, className: 'text-orange-500 dark:text-orange-400' },
    low: { icon: Info, className: 'text-yellow-500 dark:text-yellow-400' },
  }

export const severityBadgeVariant: Record<Severity, BadgeVariant> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
}

interface Props {
  riskProfile: AuthorRiskProfile | null | undefined
  size?: 'sm' | 'md'
  className?: string
  onInvestigate?: (authorId: string) => void
}

export function AuthorRiskIndicator(props: Props) {
  if (!props.riskProfile || props.riskProfile.signals.length === 0) return null

  const severity = props.riskProfile.highestSeverity
  if (!severity) return null

  const config = severityIconConfig[severity]
  const Icon = config.icon
  const size = props.size ?? 'sm'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const isClickable = !!props.onInvestigate

  const handleClick = () => {
    if (props.onInvestigate && props.riskProfile) {
      props.onInvestigate(props.riskProfile.authorId)
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
          aria-label={`Author risk: ${severity} severity, ${props.riskProfile.signals.length} signal${props.riskProfile.signals.length > 1 ? 's' : ''}`}
          onClick={isClickable ? handleClick : undefined}
          onKeyDown={
            isClickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
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
        <div className="space-y-2">
          <div className="font-semibold text-sm">Author Risk Signals</div>
          {props.riskProfile.signals.map((signal, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
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
          {isClickable && (
            <p className="text-xs text-blue-500 dark:text-blue-400 pt-1 border-t border-gray-200 dark:border-gray-600">
              Click to investigate
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
