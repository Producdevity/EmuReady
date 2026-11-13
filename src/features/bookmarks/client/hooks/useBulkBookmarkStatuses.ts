'use client'

import { useUser } from '@clerk/nextjs'
import { chunk } from 'remeda'
import { STALE_TIMES } from '@/data/constants'
import { api } from '@/lib/api'

export function useBulkBookmarkStatuses(type: 'listing' | 'pcListing', ids: string[]) {
  const { user } = useUser()
  const queries = api.useQueries((router) =>
    chunk(ids, 50).map((batch) =>
      type === 'listing'
        ? router.bookmarks.getBulkListingBookmarkStatuses(
            { listingIds: batch },
            { enabled: Boolean(user), staleTime: STALE_TIMES.USER_ACTION },
          )
        : router.bookmarks.getBulkPcListingBookmarkStatuses(
            { pcListingIds: batch },
            { enabled: Boolean(user), staleTime: STALE_TIMES.USER_ACTION },
          ),
    ),
  )
  const statuses: Record<string, boolean> = {}
  for (const query of queries) Object.assign(statuses, query.data?.statuses)
  const isPending = queries.some((query) => query.isPending)
  return { statuses, isPending }
}
