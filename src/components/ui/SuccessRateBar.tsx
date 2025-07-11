'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getBarColor, getBarWidth } from '@/utils/vote'

interface Props {
  rate: number
  voteCount?: number
  hideVoteCount?: boolean
  compact?: boolean
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
            width: `${getBarWidth(roundedRate, voteCount)}%`,
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
