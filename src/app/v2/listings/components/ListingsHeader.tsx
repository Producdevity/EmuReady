'use client'

import { Grid, List } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface Props {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  listingsCount: number
  isLoading: boolean
}

export function ListingsHeader(props: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Game Listings
          <span className="text-sm font-normal text-blue-600 dark:text-blue-400 ml-2">
            V2
          </span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {props.isLoading
            ? 'Loading...'
            : `${props.listingsCount} listings found`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => props.setViewMode('grid')}
            className={`rounded-none px-3 ${
              props.viewMode === 'grid'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : ''
            }`}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => props.setViewMode('list')}
            className={`rounded-none px-3 ${
              props.viewMode === 'list'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : ''
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        <Link href="/listings/new">
          <Button size="sm" className="hidden md:flex">
            Add Listing
          </Button>
        </Link>
      </div>
    </div>
  )
}
