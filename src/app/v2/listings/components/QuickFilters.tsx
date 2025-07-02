'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  SortAsc,
  SortDesc,
  Calendar,
  TrendingUp,
  Star,
  Gamepad2,
  RotateCcw,
  Sparkles,
  Heart,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button, PerformanceBadge } from '@/components/ui'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { SortDirection, SortField } from '@/app/listings/types'
import type { api } from '@/lib/api'

interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface SortOption {
  field: SortField | null
  direction: SortDirection | null
  label: string
  icon: React.ReactNode
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
  sortField: SortField | null
  sortDirection: SortDirection | null
  handleSort: (field: SortField, direction?: SortDirection) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
  myListingsOnly: boolean
  toggleMyListings: () => void
  userQuery: ReturnType<typeof api.users.me.useQuery>
}

const sortOptions: SortOption[] = [
  {
    field: 'createdAt',
    direction: 'desc',
    label: 'Newest',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  {
    field: 'createdAt',
    direction: 'asc',
    label: 'Oldest',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  {
    field: 'performance.rank',
    direction: 'asc',
    label: 'Best Performance',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    field: 'successRate',
    direction: 'desc',
    label: 'Highest Rated',
    icon: <Star className="w-3.5 h-3.5" />,
  },
  {
    field: 'game.title',
    direction: 'asc',
    label: 'A-Z',
    icon: <SortAsc className="w-3.5 h-3.5" />,
  },
  {
    field: 'game.title',
    direction: 'desc',
    label: 'Z-A',
    icon: <SortDesc className="w-3.5 h-3.5" />,
  },
]

export function QuickFilters(props: Props) {
  const {
    performanceScales,
    performanceIds,
    handlePerformanceChange,
    sortField,
    sortDirection,
    handleSort,
    hasActiveFilters,
    clearAllFilters,
    myListingsOnly,
    toggleMyListings,
    userQuery,
  } = props

  const quickFilters = useMemo(() => {
    const scales = performanceScales || []
    const highPerformanceIds = scales
      .filter((scale) => scale.rank >= 4)
      .map((scale) => scale.id)

    const filters: QuickFilter[] = [
      {
        label: 'Playable',
        action: () => {
          handlePerformanceChange(highPerformanceIds)
          analytics.filter.performance(highPerformanceIds)
        },
        icon: Zap,
        isActive:
          performanceIds.length > 0 &&
          performanceIds.every((id) => highPerformanceIds.includes(id)) &&
          highPerformanceIds.every((id) => performanceIds.includes(id)),
      },
      {
        label: 'Recent',
        action: () => {
          handleSort('createdAt', 'desc')
          // Analytics tracking for sort
          analytics.filter.sort('createdAt')
        },
        icon: Calendar,
        isActive: sortField === 'createdAt' && sortDirection === 'desc',
      },
      {
        label: 'Popular',
        action: () => {
          handleSort('successRate', 'desc')
          // Analytics tracking for sort
          analytics.filter.sort('successRate')
        },
        icon: Heart,
        isActive: sortField === 'successRate' && sortDirection === 'desc',
      },
    ]

    // Add "My Listings" filter if user is logged in
    if (userQuery.data) {
      filters.push({
        label: 'My Listings',
        action: () => {
          toggleMyListings()
          analytics.filter.myListings(!myListingsOnly)
        },
        icon: User,
        isActive: myListingsOnly,
      })
    }

    return filters
  }, [
    performanceScales,
    performanceIds,
    sortField,
    sortDirection,
    myListingsOnly,
    userQuery.data,
    handlePerformanceChange,
    handleSort,
    toggleMyListings,
  ])

  const currentSort = sortOptions.find(
    (option) =>
      option.field === sortField && option.direction === sortDirection,
  )

  const handlePerformanceToggle = (performanceId: number) => {
    const newPerformanceIds = performanceIds.includes(performanceId)
      ? performanceIds.filter((id) => id !== performanceId)
      : [...performanceIds, performanceId]

    handlePerformanceChange(newPerformanceIds)

    // Analytics
    analytics.filter.performance(newPerformanceIds)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25)
    }
  }

  const handleSortChange = (option: SortOption) => {
    if (option.field && option.direction) {
      handleSort(option.field, option.direction)
      // Analytics tracking for sort
      analytics.filter.sort(option.field)
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25)
    }
  }

  const handleClearAll = () => {
    clearAllFilters()
    analytics.filter.clearAll()

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Action Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {quickFilters.map((filter, index) => (
          <motion.button
            key={filter.label}
            onClick={filter.action}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              'border-2 hover:scale-105 active:scale-95',
              filter.isActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            <filter.icon className="w-4 h-4" />
            <span>{filter.label}</span>

            {filter.isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-blue-500 rounded-full ml-1"
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Performance Quick Filters */}
      {performanceScales && performanceScales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Performance Levels
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {performanceScales
              .sort((a, b) => a.rank - b.rank)
              .map((scale) => {
                const isSelected = performanceIds.includes(scale.id)

                return (
                  <motion.button
                    key={scale.id}
                    onClick={() => handlePerformanceToggle(scale.id)}
                    className={cn(
                      'group relative overflow-hidden rounded-lg transition-all duration-200',
                      'border-2 p-3 min-w-[80px] text-center',
                      'hover:scale-105 hover:shadow-lg active:scale-95',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                    )}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Background animation */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: isSelected ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                    />

                    <div className="relative z-10">
                      <PerformanceBadge
                        rank={scale.rank}
                        label={scale.label}
                        description={scale.description}
                      />

                      <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                        {scale.label}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center"
                        >
                          <Sparkles className="w-3 h-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Sort Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option, index) => {
            const isSelected =
              currentSort?.field === option.field &&
              currentSort?.direction === option.direction

            return (
              <motion.button
                key={`${option.field}-${option.direction}`}
                onClick={() => handleSortChange(option)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  'border-2 hover:scale-105 active:scale-95',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {option.icon}
                <span>{option.label}</span>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-blue-500 rounded-full ml-1"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Active Filters Summary & Clear All */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Filters Active
              </span>
              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {[
                  performanceIds.length,
                  currentSort ? 1 : 0,
                  myListingsOnly ? 1 : 0,
                ].reduce((sum, count) => sum + count, 0)}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
