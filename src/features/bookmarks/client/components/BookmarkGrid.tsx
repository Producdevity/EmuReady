'use client'

import { keepPreviousData } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { type z } from 'zod'
import { ErrorFallback, LoadingSpinner, Pagination } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import BookmarkCard from './BookmarkCard'
import SearchEmptyState from './SearchEmptyState'
import { type BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'
import { useBulkBookmarkStatuses, getBookmarkStatus } from '../hooks/useBulkBookmarkStatuses'

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

type BookmarkPagination = Extract<
  RouterOutput['bookmarks']['getListingBookmarks'],
  { visibility: 'visible' }
>['pagination']

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
  const paginationScope = JSON.stringify([
    props.userId,
    props.variant,
    props.limit,
    props.search,
    props.filters,
  ])
  const [lastPagination, setLastPagination] = useState<{
    scope: string
    pagination: BookmarkPagination
  } | null>(null)
  if (
    query.data?.visibility === 'visible' &&
    !query.isPlaceholderData &&
    (lastPagination?.scope !== paginationScope ||
      lastPagination.pagination !== query.data.pagination)
  ) {
    setLastPagination({ scope: paginationScope, pagination: query.data.pagination })
  } else if (query.data?.visibility === 'hidden' && lastPagination !== null) {
    setLastPagination(null)
  }
  const pagination =
    query.data?.visibility === 'visible'
      ? query.data.pagination
      : query.data?.visibility !== 'hidden' && lastPagination?.scope === paginationScope
        ? lastPagination.pagination
        : null
  const paginationControls = pagination && pagination.pages > 1 && (
    <Pagination
      page={props.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      itemsPerPage={props.limit}
      onPageChange={props.onPageChange}
    />
  )

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

  const { page, onPageChange } = props
  useEffect(() => {
    if (
      query.isError ||
      query.isFetching ||
      query.isPlaceholderData ||
      query.data?.visibility !== 'visible'
    )
      return
    const lastPage = Math.max(1, query.data.pagination.pages)
    if (page > lastPage) onPageChange(lastPage)
  }, [page, onPageChange, query.data, query.isError, query.isFetching, query.isPlaceholderData])

  if (query.isError) {
    return (
      <>
        <ErrorFallback
          error={query.error instanceof Error ? query.error : null}
          resetErrorBoundary={() => {
            void query.refetch()
          }}
        />
        {paginationControls}
      </>
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
          status={getBookmarkStatus(bookmarks, item.listing.id)}
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
          status={getBookmarkStatus(bookmarks, item.pcListing.id)}
        />
      ))
    }
    return null
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{renderItems()}</div>
      {paginationControls}
    </>
  )
}

export default BookmarkGrid
