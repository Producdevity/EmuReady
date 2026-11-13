'use client'

import { keepPreviousData } from '@tanstack/react-query'
import { type z } from 'zod'
import { ErrorFallback, LoadingSpinner, Pagination } from '@/components/ui'
import { api } from '@/lib/api'
import BookmarkCard from './BookmarkCard'
import SearchEmptyState from './SearchEmptyState'
import { type BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'
import { useBulkBookmarkStatuses } from '../hooks/useBulkBookmarkStatuses'
import type { ReactNode } from 'react'

interface Props {
  variant: 'handheld' | 'pc'
  userId: string
  page: number
  limit: number
  search: string
  filters: z.output<typeof BookmarkFiltersSchema>
  hasFilters: boolean
  onPageChange: (page: number) => void
  emptyContent: ReactNode
}

function BookmarkGrid(props: Props) {
  const listingQuery = api.bookmarks.getListingBookmarks.useQuery(
    {
      userId: props.userId,
      page: props.page,
      limit: props.limit,
      search: props.search || undefined,
      ...props.filters,
    },
    { placeholderData: keepPreviousData, enabled: props.variant === 'handheld' },
  )

  const pcQuery = api.bookmarks.getPcListingBookmarks.useQuery(
    {
      userId: props.userId,
      page: props.page,
      limit: props.limit,
      search: props.search || undefined,
      ...props.filters,
    },
    { placeholderData: keepPreviousData, enabled: props.variant === 'pc' },
  )

  const query = props.variant === 'handheld' ? listingQuery : pcQuery

  const ids =
    props.variant === 'handheld'
      ? listingQuery.data?.visibility === 'visible'
        ? listingQuery.data.items.map((item) => item.listing.id)
        : []
      : pcQuery.data?.visibility === 'visible'
        ? pcQuery.data.items.map((item) => item.pcListing.id)
        : []
  const bookmarks = useBulkBookmarkStatuses(
    props.variant === 'handheld' ? 'listing' : 'pcListing',
    ids,
  )

  if (query.isError) {
    return (
      <ErrorFallback
        error={query.error instanceof Error ? query.error : null}
        resetErrorBoundary={() => {
          void query.refetch()
        }}
      />
    )
  }

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (query.data?.visibility !== 'visible') {
    return <>{props.emptyContent}</>
  }

  if (query.data.items.length === 0) {
    if (props.hasFilters) {
      return <SearchEmptyState />
    }
    return <>{props.emptyContent}</>
  }

  const renderItems = () => {
    if (props.variant === 'handheld' && listingQuery.data?.visibility === 'visible') {
      return listingQuery.data.items.map((item, index) => (
        <BookmarkCard
          key={item.id}
          item={item}
          variant="handheld"
          index={index}
          status={{
            isBookmarked: bookmarks.statuses[item.listing.id] ?? false,
            isPending: bookmarks.isPending,
          }}
        />
      ))
    }
    if (props.variant === 'pc' && pcQuery.data?.visibility === 'visible') {
      return pcQuery.data.items.map((item, index) => (
        <BookmarkCard
          key={item.id}
          item={item}
          variant="pc"
          index={index}
          status={{
            isBookmarked: bookmarks.statuses[item.pcListing.id] ?? false,
            isPending: bookmarks.isPending,
          }}
        />
      ))
    }
    return null
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{renderItems()}</div>
      {query.data.pagination.pages > 1 && (
        <Pagination
          page={props.page}
          totalPages={query.data.pagination.pages}
          totalItems={query.data.pagination.total}
          itemsPerPage={props.limit}
          onPageChange={props.onPageChange}
        />
      )}
    </>
  )
}

export default BookmarkGrid
