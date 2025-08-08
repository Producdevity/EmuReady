'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface BarData {
  label: string
  value: number
  color?: string
}

interface Props {
  data: BarData[]
  width?: number
  height?: number
  horizontal?: boolean
  showValues?: boolean
  showGrid?: boolean
  className?: string
  barColor?: string
  maxValue?: number
}

// It looks fine on the frontend, don't look at the code too much
export function BarChart(props: Props) {
  const width = props.width ?? 400
  const height = props.height ?? 300
  const horizontal = props.horizontal ?? false
  const showValues = props.showValues ?? true
  const showGrid = props.showGrid ?? true
  const padding = 40
  const labelPadding = horizontal ? 60 : 30
  const chartWidth = width - padding * 2 - (horizontal ? labelPadding : 0)
  const chartHeight = height - padding * 2 - (horizontal ? 0 : labelPadding)

  const { bars, gridLines } = useMemo(() => {
    if (props.data.length === 0) return { bars: [], gridLines: [] }

    const maxVal = props.maxValue ?? Math.max(...props.data.map((d) => d.value))
    const barThickness = horizontal
      ? (chartHeight / props.data.length) * 0.8
      : (chartWidth / props.data.length) * 0.8

    const bars = props.data.map((item, index) => {
      const ratio = maxVal > 0 ? item.value / maxVal : 0

      if (horizontal) {
        const barWidth = ratio * chartWidth
        const y =
          padding +
          (index * chartHeight) / props.data.length +
          (chartHeight / props.data.length - barThickness) / 2

        return {
          ...item,
          x: padding + labelPadding,
          y,
          width: barWidth,
          height: barThickness,
          labelX: padding + labelPadding - 10,
          labelY: y + barThickness / 2,
          valueX: padding + labelPadding + barWidth + 5,
          valueY: y + barThickness / 2,
        }
      } else {
        const barHeight = ratio * chartHeight
        const xPos =
          padding +
          (index * chartWidth) / props.data.length +
          (chartWidth / props.data.length - barThickness) / 2

        return {
          ...item,
          x: xPos,
          y: height - padding - labelPadding - barHeight,
          width: barThickness,
          height: barHeight,
          labelX: xPos + barThickness / 2,
          labelY: height - padding - 5,
          valueX: xPos + barThickness / 2,
          valueY: height - padding - labelPadding - barHeight - 5,
        }
      }
    })

    // Generate grid lines
    const gridLines = showGrid
      ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          if (horizontal) {
            return {
              x1: padding + labelPadding + ratio * chartWidth,
              y1: padding,
              x2: padding + labelPadding + ratio * chartWidth,
              y2: height - padding,
            }
          } else {
            return {
              x1: padding,
              y1: padding + ratio * chartHeight,
              x2: width - padding,
              y2: padding + ratio * chartHeight,
            }
          }
        })
      : []

    return { bars, gridLines }
  }, [
    props.data,
    chartWidth,
    chartHeight,
    height,
    width,
    padding,
    labelPadding,
    horizontal,
    props.maxValue,
    showGrid,
  ])

  if (props.data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center border rounded-lg', props.className)}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">No data available</span>
      </div>
    )
  }

  return (
    <div className={cn('relative', props.className)}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {showGrid && (
          <g className="opacity-20">
            {gridLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* Bars */}
        {bars.map((bar, index) => (
          <g key={index}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color || props.barColor || '#3b82f6'}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              rx={2}
            >
              <title>{`${bar.label}: ${bar.value}`}</title>
            </rect>

            {/* Value labels */}
            {showValues && (
              <text
                x={bar.valueX}
                y={bar.valueY}
                textAnchor="middle"
                dominantBaseline={horizontal ? 'middle' : 'auto'}
                className="text-xs fill-current opacity-70 pointer-events-none"
              >
                {bar.value}
              </text>
            )}
          </g>
        ))}

        {/* Axis labels */}
        {bars.map((bar, index) => (
          <text
            key={`label-${index}`}
            x={bar.labelX}
            y={bar.labelY}
            textAnchor={horizontal ? 'end' : 'middle'}
            dominantBaseline={horizontal ? 'middle' : 'hanging'}
            className="text-xs fill-current opacity-70 pointer-events-none"
          >
            {bar.label}
          </text>
        ))}

        {/* Axes */}
        <g className="opacity-60">
          {horizontal ? (
            <line
              x1={padding + labelPadding}
              y1={padding}
              x2={padding + labelPadding}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth={1}
            />
          ) : (
            <line
              x1={padding}
              y1={height - padding - labelPadding}
              x2={width - padding}
              y2={height - padding - labelPadding}
              stroke="currentColor"
              strokeWidth={1}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
