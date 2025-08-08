'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface Props {
  data: DonutSegment[]
  size?: number
  strokeWidth?: number
  className?: string
  showLabels?: boolean
  centerText?: string
  centerSubtext?: string
}

export function DonutChart(props: Props) {
  const size = props.size ?? 200
  const strokeWidth = props.strokeWidth ?? 20
  const showLabels = props.showLabels ?? true

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const { segments, total } = useMemo(() => {
    const total = props.data.reduce((sum, segment) => sum + segment.value, 0)

    if (total === 0) return { segments: [], total: 0 }

    let cumulativePercentage = 0
    const segments = props.data.map((segment) => {
      const percentage = (segment.value / total) * 100
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
      const strokeDashoffset = -((cumulativePercentage / 100) * circumference)

      cumulativePercentage += percentage

      return {
        ...segment,
        percentage,
        strokeDasharray,
        strokeDashoffset,
      }
    })

    return { segments, total }
  }, [props.data, circumference])

  if (total === 0) {
    return (
      <div
        className={cn('flex items-center justify-center border rounded-lg', props.className)}
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-sm">No data</span>
      </div>
    )
  }

  return (
    <div className={cn('relative', props.className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-10"
        />

        {/* Segments */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 hover:opacity-80"
          >
            <title>{`${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`}</title>
          </circle>
        ))}
      </svg>

      {/* Center text */}
      {(props.centerText || props.centerSubtext) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {props.centerText && (
            <div className="text-2xl font-bold text-foreground">{props.centerText}</div>
          )}
          {props.centerSubtext && (
            <div className="text-sm text-muted-foreground">{props.centerSubtext}</div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLabels && props.data.length > 0 && (
        <div className="mt-4 space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="flex-1 truncate">{segment.label}</span>
              <span className="text-muted-foreground">{segment.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
