'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { type ListingType } from '@/schemas/common'
import { ApprovalSection } from './ApprovalSection'
import { VotesSection } from './VotesSection'

interface Props {
  listingId: string
  listingType: ListingType
}

export function ModeratorInfoPanel(props: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const moderatorInfoQuery = api.listings.moderatorInfo.useQuery(
    { id: props.listingId, type: props.listingType },
    { enabled: isExpanded, refetchOnWindowFocus: false },
  )

  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className="mt-8 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-950/20">
      <button
        type="button"
        onClick={() => setIsExpanded((prevValue) => !prevValue)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <ChevronIcon className="h-4 w-4" />
        Moderator Info
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-6 border-t border-amber-200 dark:border-amber-800">
          {moderatorInfoQuery.isLoading && (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          )}

          {moderatorInfoQuery.data && (
            <>
              <div className="pt-4">
                <ApprovalSection approval={moderatorInfoQuery.data.approval} />
              </div>
              <VotesSection
                votes={moderatorInfoQuery.data.votes}
                voteCounts={moderatorInfoQuery.data.voteCounts}
              />
            </>
          )}

          {moderatorInfoQuery.isError && (
            <p className="text-sm text-red-500 dark:text-red-400 py-4">
              Failed to load moderator info.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
