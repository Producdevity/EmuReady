'use client'

import { useMemo } from 'react'

interface Props {
  rate: number
  voteCount?: number
  hideVoteCount?: boolean
}

// Determine color based on success rate
function getBarColor(rate: number) {
  if (rate >= 75) return 'bg-green-500'
  if (rate >= 50) return 'bg-yellow-500'
  if (rate >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

export function SuccessRateBar(props: Props) {
  const voteCount = props.voteCount ?? 0
  const roundedRate = useMemo(() => Math.round(props.rate), [props.rate])
  const barColor = useMemo(() => getBarColor(roundedRate), [roundedRate])

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
      >
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${roundedRate}%`, transition: 'width 0.3s' }}
        />
      </div>
      {!props.hideVoteCount && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {roundedRate}%{' '}
          {voteCount > 0 &&
            `(${voteCount} ${voteCount === 1 ? 'vote' : 'votes'})`}
        </span>
      )}
    </div>
  )
}
