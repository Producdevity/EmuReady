import { isNullish } from 'remeda'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import Badge from './Badge'

interface Props {
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | number
  label: string
  pill?: boolean
  description?: string | null
}

const performanceColorMap: Record<number, string> = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', // Perfect - Green
  2: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200', // Great - Light Green
  3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', // Playable - Yellow Green
  4: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', // Poor - Orange
  5: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', // Ingame - Red Orange
  6: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100', // Intro - Red
  7: 'bg-red-300 text-red-900 dark:bg-red-700 dark:text-red-100', // Loadable - Dark Red
  8: 'bg-red-400 text-red-900 dark:bg-red-600 dark:text-red-100', // Nothing - Darkest Red
}

const defaultPerformanceColor =
  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'

function PerformanceBadge(props: Props) {
  const customColorClass =
    performanceColorMap[props.rank] ?? defaultPerformanceColor

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center items-center">
          <Badge
            className={customColorClass}
            pill={isNullish(props.pill) ? false : props.pill}
          >
            {props.label}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {props.description ?? 'No description available'}
      </TooltipContent>
    </Tooltip>
  )
}

export default PerformanceBadge
