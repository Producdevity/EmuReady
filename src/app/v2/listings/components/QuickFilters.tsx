'use client'

import { Calendar, Heart, Zap, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui'
import type { SortDirection, SortField } from '@/app/listings/types'

// Extended PerformanceScale type with description
interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface QuickFilter {
  label: string
  action: () => void
  icon: LucideIcon
  isActive: boolean
}

interface Props {
  performanceScales: PerformanceScale[] | undefined
  performanceIds: number[]
  handlePerformanceChange: (values: number[]) => void
  sortField?: SortField | null
  sortDirection?: SortDirection | null
  handleSort: (field: SortField, direction?: SortDirection) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
}

export function QuickFilters(props: Props) {
  const quickFilters = useMemo(() => {
    const performanceScales = props.performanceScales || []
    const highPerformanceIds = performanceScales
      .filter((scale) => scale.rank >= 4)
      .map((scale) => scale.id)

    const filters: QuickFilter[] = [
      {
        label: 'Playable',
        action: () => {
          // Set to high performance ratings (4-5)
          props.handlePerformanceChange(highPerformanceIds)
        },
        icon: Zap,
        isActive:
          props.performanceIds.length > 0 &&
          props.performanceIds.every((id) => highPerformanceIds.includes(id)) &&
          highPerformanceIds.every((id) => props.performanceIds.includes(id)),
      },
      {
        label: 'Recent',
        action: () => {
          props.handleSort('createdAt', 'desc')
        },
        icon: Calendar,
        isActive:
          props.sortField === 'createdAt' && props.sortDirection === 'desc',
      },
      {
        label: 'Popular',
        action: () => {
          props.handleSort('successRate', 'desc')
        },
        icon: Heart,
        isActive:
          props.sortField === 'successRate' && props.sortDirection === 'desc',
      },
    ]

    return filters
  }, [props])

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {quickFilters.map((filter, index) => (
        <Button
          key={index}
          variant={filter.isActive ? 'default' : 'outline'}
          size="sm"
          onClick={filter.action}
          className="flex items-center gap-1.5"
        >
          <filter.icon className="w-4 h-4" />
          {filter.label}
        </Button>
      ))}

      {props.hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={props.clearAllFilters}
          className="text-red-600 dark:text-red-400"
        >
          Clear All
        </Button>
      )}
    </div>
  )
}
