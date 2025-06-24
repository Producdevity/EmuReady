'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface Props {
  hasActiveFilters: boolean
  clearAllFilters: () => void
}

export function EmptyState(props: Props) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Search className="w-16 h-16 mx-auto mb-4" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No listings found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {props.hasActiveFilters
          ? 'Try adjusting your filters or search terms'
          : 'Be the first to add a listing!'}
      </p>
      {props.hasActiveFilters ? (
        <Button onClick={props.clearAllFilters} variant="outline">
          Clear All Filters
        </Button>
      ) : (
        <Button asChild>
          <Link href="/listings/new">Add a Listing</Link>
        </Button>
      )}
    </div>
  )
}
