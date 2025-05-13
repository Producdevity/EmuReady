'use client'

import React from 'react'

export function SuccessRateBar({ rate }: { rate: number }) {
  let color = 'bg-gray-300'
  if (rate >= 80) color = 'bg-green-500'
  else if (rate >= 50) color = 'bg-yellow-400'
  else if (rate > 0) color = 'bg-red-500'
  
  return (
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded">
      <div
        className={`h-4 rounded ${color}`}
        style={{ width: `${rate}%`, transition: 'width 0.3s' }}
      />
      <span className="ml-2 text-xs text-gray-700 dark:text-gray-200 align-middle">
        {rate}%
      </span>
    </div>
  )
} 