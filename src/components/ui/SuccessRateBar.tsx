'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  rate: number
  voteCount?: number
  hideVoteCount?: boolean
  compact?: boolean
}

// Determine color based on success rate
function getBarColor(rate: number) {
  if (rate >= 75) return 'bg-green-500'
  if (rate >= 50) return 'bg-yellow-500'
  if (rate >= 25) return 'bg-orange-500'
  return 'bg-red-500'
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
          style={{ width: `${roundedRate}%`, transition: 'width 0.3s' }}
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
