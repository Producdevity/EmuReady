import { isNullish } from 'remeda'
import { Tooltip, TooltipContent, TooltipTrigger, Badge } from '@/components/ui'
import { performanceColorMap, defaultPerformanceColor } from '@/data/styles'
import { cn } from '@/lib/utils'
import { type PerformanceRank } from '@/types/api'

interface Props {
  rank: PerformanceRank
  label: string
  pill?: boolean
  description?: string | null
  className?: string
}

export function PerformanceBadge(props: Props) {
  const customColorClass = performanceColorMap[props.rank] ?? defaultPerformanceColor

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex justify-center items-center', props.className)}>
          <Badge className={customColorClass} pill={isNullish(props.pill) ? false : props.pill}>
            {props.label}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>{props.description ?? 'No description available'}</TooltipContent>
    </Tooltip>
  )
}
