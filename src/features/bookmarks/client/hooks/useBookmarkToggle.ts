import { useUser } from '@clerk/nextjs'
import { skipToken } from '@tanstack/react-query'
import { useState } from 'react'
import { STALE_TIMES } from '@/data/constants'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface ListingBookmarkConfig {
  type: 'listing'
  listingId: string
}

interface PcListingBookmarkConfig {
  type: 'pcListing'
  pcListingId: string
}

export type BookmarkConfig = ListingBookmarkConfig | PcListingBookmarkConfig

export function useBookmarkToggle(
  config: BookmarkConfig,
  status?: { isBookmarked: boolean; isPending: boolean },
) {
  const { user } = useUser()
  const utils = api.useUtils()
  const [optimisticBookmarked, setOptimisticBookmarked] = useState<boolean | null>(null)

  const reportId = config.type === 'listing' ? config.listingId : config.pcListingId
  const identity = `${config.type}:${reportId}`
  const [previousIdentity, setPreviousIdentity] = useState(identity)
  if (previousIdentity !== identity) {
    setPreviousIdentity(identity)
    setOptimisticBookmarked(null)
  }

  const isListing = config.type === 'listing'

  const listingStatusQuery = api.bookmarks.isBookmarked.useQuery(
    user && isListing && !status ? { listingId: config.listingId } : skipToken,
    { staleTime: STALE_TIMES.USER_ACTION },
  )

  const pcListingStatusQuery = api.bookmarks.isPcBookmarked.useQuery(
    user && !isListing && !status ? { pcListingId: config.pcListingId } : skipToken,
    { staleTime: STALE_TIMES.USER_ACTION },
  )

  const statusQuery = isListing ? listingStatusQuery : pcListingStatusQuery

  const resetOptimistic = () => setOptimisticBookmarked(null)
  const onError = (error: unknown) => {
    resetOptimistic()
    toast.error(getErrorMessage(error))
  }

  // Refresh active individual and batch statuses before clearing the optimistic value.
  const invalidateListingQueries = async () => {
    if (config.type === 'listing') {
      await Promise.all([
        utils.bookmarks.isBookmarked.invalidate({ listingId: config.listingId }),
        utils.bookmarks.getBulkListingBookmarkStatuses.invalidate(),
      ])
      utils.bookmarks.getListingBookmarks.invalidate()
    }
    utils.bookmarks.getCounts.invalidate()
  }

  const invalidatePcListingQueries = async () => {
    if (config.type === 'pcListing') {
      await Promise.all([
        utils.bookmarks.isPcBookmarked.invalidate({ pcListingId: config.pcListingId }),
        utils.bookmarks.getBulkPcListingBookmarkStatuses.invalidate(),
      ])
      utils.bookmarks.getPcListingBookmarks.invalidate()
    }
    utils.bookmarks.getCounts.invalidate()
  }

  const bookmarkMutation = api.bookmarks.bookmark.useMutation({
    onSuccess: async () => {
      await invalidateListingQueries()
      resetOptimistic()
    },
    onError,
  })

  const unbookmarkMutation = api.bookmarks.unbookmark.useMutation({
    onSuccess: async () => {
      await invalidateListingQueries()
      resetOptimistic()
    },
    onError,
  })

  const pcBookmarkMutation = api.bookmarks.pcBookmark.useMutation({
    onSuccess: async () => {
      await invalidatePcListingQueries()
      resetOptimistic()
    },
    onError,
  })

  const pcUnbookmarkMutation = api.bookmarks.pcUnbookmark.useMutation({
    onSuccess: async () => {
      await invalidatePcListingQueries()
      resetOptimistic()
    },
    onError,
  })

  const isBookmarked =
    optimisticBookmarked ?? status?.isBookmarked ?? statusQuery.data?.isBookmarked ?? false
  const isPending = isListing
    ? bookmarkMutation.isPending || unbookmarkMutation.isPending
    : pcBookmarkMutation.isPending || pcUnbookmarkMutation.isPending

  const handleToggle = () => {
    if (isPending) return

    setOptimisticBookmarked(!isBookmarked)

    if (isListing) {
      if (isBookmarked) {
        unbookmarkMutation.mutate({ listingId: config.listingId })
      } else {
        bookmarkMutation.mutate({ listingId: config.listingId })
      }
    } else {
      if (isBookmarked) {
        pcUnbookmarkMutation.mutate({ pcListingId: config.pcListingId })
      } else {
        pcBookmarkMutation.mutate({ pcListingId: config.pcListingId })
      }
    }
  }

  return {
    user,
    isBookmarked,
    isPending,
    isStatusPending: status?.isPending ?? statusQuery.isPending,
    handleToggle,
  }
}
