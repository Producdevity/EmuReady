'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  rate: number
  voteCount?: number
  hideVoteCount?: boolean
  compact?: boolean
}

/**
 * Get the color class for the success rate bar based on the rate
 * @param rate
 * @param voteCount
 */
function getBarColor(rate: number) {
  if (rate >= 95) return 'bg-green-600' // Excellent - dark green
  if (rate >= 85) return 'bg-green-500' // Very good - green
  if (rate >= 75) return 'bg-green-400' // Good - light green
  if (rate >= 65) return 'bg-lime-500' // Above average - lime
  if (rate >= 55) return 'bg-yellow-400' // Average+ - light yellow
  if (rate >= 45) return 'bg-yellow-500' // Average - yellow
  if (rate >= 35) return 'bg-orange-400' // Below average - light orange
  if (rate >= 25) return 'bg-orange-500' // Poor - orange
  if (rate >= 15) return 'bg-red-400' // Bad - light red
  if (rate >= 5) return 'bg-red-500' // Very bad - red
  return 'bg-red-600' // Terrible - dark red
}

export function SuccessRateBar(props: Props) {
  const { compact = false } = props
  const voteCount = props.voteCount ?? 0
  const roundedRate = useMemo(() => Math.round(props.rate), [props.rate])
  const barColor = useMemo(() => getBarColor(roundedRate), [roundedRate])

  return (
    <div className={cn('flex flex-col gap-1', compact ? 'w-20' : 'w-full')}>
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          compact ? 'h-1.5' : 'h-2',
        )}
      >
        <div
          className={cn('rounded-full', barColor, compact ? 'h-1.5' : 'h-2')}
          style={{
            width: `${roundedRate === 0 && voteCount > 0 ? 100 : roundedRate}%`,
            transition: 'width 0.3s',
          }}
        />
      </div>
      {!props.hideVoteCount && !compact && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {roundedRate}%{' '}
          {voteCount > 0 &&
            `(${voteCount} ${voteCount === 1 ? 'vote' : 'votes'})`}
        </span>
      )}
    </div>
  )
}
