'use client'

import { LoadingSpinner, VirtualScroller, Pagination } from '@/components/ui'
import { useMediaQuery } from '@/hooks'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'
import { ListingCard } from './ListingCard'
import type { RouterOutput } from '@/types/trpc'

type ListingType = RouterOutput['listings']['get']['listings'][number]

interface Props {
  allListings: ListingType[]
  viewMode: 'grid' | 'list'
  showSystemIcons: boolean
  isLoading: boolean
  isFetching: boolean
  hasMoreItems: boolean
  currentPage: number
  totalPages?: number
  loadMoreListings: () => void
  onPageChange?: (page: number) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
}

export function ListingsContent(props: Props) {
  const {
    allListings,
    viewMode,
    showSystemIcons,
    isLoading,
    isFetching,
    hasMoreItems,
    currentPage,
    totalPages,
    loadMoreListings,
    onPageChange,
    hasActiveFilters,
    clearAllFilters,
  } = props

  // Use mobile-first approach: VirtualScroller on mobile, grid with pagination on desktop
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Loading state - Skeleton Loader
  if (isLoading && currentPage === 1) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse',
              viewMode === 'list' ? 'flex items-center p-4' : 'p-0',
            )}
          >
            {viewMode === 'grid' ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  // No listings found
  if (allListings.length === 0) {
    return (
      <EmptyState
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
      />
    )
  }

  // Listings content
  return (
    <div className="relative" style={{ minHeight: '500px' }}>
      {isMobile || viewMode === 'list' ? (
        // Mobile or list view: Use VirtualScroller for performance
        <VirtualScroller
          items={allListings}
          renderItem={(listing) => (
            <div className={viewMode === 'grid' ? 'p-2' : 'py-2'}>
              <ListingCard
                listing={listing}
                viewMode={viewMode}
                showSystemIcons={showSystemIcons}
              />
            </div>
          )}
          itemHeight={viewMode === 'grid' ? 380 : 120}
          onEndReached={loadMoreListings}
          endReachedThreshold={300}
          getItemKey={(item) => item.id}
          overscan={5}
          className={cn(
            'pb-12',
            viewMode === 'grid' && 'grid grid-cols-1 sm:grid-cols-2 gap-4',
          )}
        />
      ) : (
        // Desktop grid view: Use CSS Grid with pagination
        <>
          <div className="pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                viewMode={viewMode}
                showSystemIcons={showSystemIcons}
              />
            ))}
          </div>

          {/* Pagination for desktop grid view */}
          {totalPages && totalPages > 1 && onPageChange && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                showLabel={true}
              />
            </div>
          )}
        </>
      )}

      {/* Loading indicator for infinite scroll (mobile/list view only) */}
      {(isMobile || viewMode === 'list') &&
        (isLoading || isFetching) &&
        currentPage > 1 && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}

      {/* End of results message (mobile/list view only) */}
      {(isMobile || viewMode === 'list') &&
        !hasMoreItems &&
        allListings.length > 0 &&
        !isLoading &&
        !isFetching && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            You&apos;ve reached the end of the listings
          </div>
        )}
    </div>
  )
}
