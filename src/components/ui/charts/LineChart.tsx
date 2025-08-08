'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DataPoint {
  x: number
  y: number
  label?: string
}

interface Props {
  data: DataPoint[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  showDots?: boolean
  showGrid?: boolean
  className?: string
  yAxisLabel?: string
  xAxisLabel?: string
}

export function LineChart(props: Props) {
  const width = props.width ?? 400
  const height = props.height ?? 200
  const color = props.color ?? '#3b82f6'
  const showDots = props.showDots ?? true
  const showGrid = props.showGrid ?? true

  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const { xScale, yScale, pathData, gridLines } = useMemo(() => {
    if (props.data.length === 0) {
      return {
        xScale: () => 0,
        yScale: () => 0,
        pathData: '',
        gridLines: { x: [], y: [] },
      }
    }

    const xMin = Math.min(...props.data.map((d) => d.x))
    const xMax = Math.max(...props.data.map((d) => d.x))
    const yMin = Math.min(...props.data.map((d) => d.y))
    const yMax = Math.max(...props.data.map((d) => d.y))

    // Add padding to y scale
    const yPadding = (yMax - yMin) * 0.1
    const yMinPadded = Math.max(0, yMin - yPadding)
    const yMaxPadded = yMax + yPadding

    const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth + padding
    const yScale = (y: number) =>
      height - (((y - yMinPadded) / (yMaxPadded - yMinPadded)) * chartHeight + padding)

    // Generate path data
    const pathData = props.data
      .map((point, index) => {
        const x = xScale(point.x)
        const y = yScale(point.y)
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

    // Generate grid lines
    const gridLines = {
      x: showGrid ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => padding + ratio * chartWidth) : [],
      y: showGrid ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => padding + ratio * chartHeight) : [],
    }

    return { xScale, yScale, pathData, gridLines }
  }, [props.data, chartWidth, chartHeight, height, padding, showGrid])

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
            {gridLines.x.map((x, i) => (
              <line
                key={`x-${i}`}
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
            {gridLines.y.map((y, i) => (
              <line
                key={`y-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={props.strokeWidth ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showDots &&
          props.data.map((point, index) => (
            <circle
              key={index}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={3}
              fill={color}
              className="hover:r-4 transition-all cursor-pointer"
            >
              {point.label && <title>{point.label}</title>}
            </circle>
          ))}

        {/* Axes */}
        <g className="text-xs fill-current opacity-60">
          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth={1}
          />

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth={1}
          />

          {/* Axis labels */}
          {props.yAxisLabel && (
            <text
              x={15}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90 15 ${height / 2})`}
              className="text-xs fill-current opacity-70"
            >
              {props.yAxisLabel}
            </text>
          )}

          {props.xAxisLabel && (
            <text
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-current opacity-70"
            >
              {props.xAxisLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}
