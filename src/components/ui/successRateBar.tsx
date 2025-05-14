'use client'

import React from 'react'

interface SuccessRateBarProps {
  rate: number
  voteCount?: number
  showVoteCount?: boolean
  height?: 'sm' | 'md'
}

export function SuccessRateBar({
  rate,
  voteCount = 0,
  showVoteCount = true,
  height = 'sm',
}: SuccessRateBarProps) {
  // Round to whole number
  const roundedRate = Math.round(rate)

  // Determine color based on success rate
  const getBarColor = () => {
    if (rate >= 75) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    if (rate >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const barHeight = height === 'sm' ? 'h-2' : 'h-3'

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={`w-full ${barHeight} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
      >
        <div
          className={`${barHeight} rounded-full ${getBarColor()}`}
          style={{ width: `${roundedRate}%`, transition: 'width 0.3s' }}
        />
      </div>
      {showVoteCount && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {roundedRate}%{' '}
          {voteCount > 0 &&
            `(${voteCount} ${voteCount === 1 ? 'vote' : 'votes'})`}
        </span>
      )}
    </div>
  )
}
