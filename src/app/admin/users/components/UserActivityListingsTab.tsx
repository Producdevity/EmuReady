'use client'

import { GamepadIcon, Search } from 'lucide-react'
import Link from 'next/link'
import { Dropdown, Input, Pagination } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'

type UserData = NonNullable<RouterOutput['users']['getUserById']>

interface Props {
  listings: UserData['listings']
  totalCount: number
  filterOptions: UserData['filterOptions']
  page: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (search: string) => void
  device: string
  onDeviceChange: (device: string) => void
  emulator: string
  onEmulatorChange: (emulator: string) => void
  isFetching: boolean
}

function UserActivityListingsTab(props: Props) {
  const hasFilters = props.search || props.device || props.emulator

  const deviceOptions = [
    { value: '', label: 'All Devices' },
    ...props.filterOptions.devices.map((d) => ({ value: d.id, label: d.label })),
  ]

  const emulatorOptions = [
    { value: '', label: 'All Emulators' },
    ...props.filterOptions.emulators.map((name) => ({ value: name, label: name })),
  ]

  return (
    <div className={cn('space-y-3', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search listings..."
            value={props.search}
            onChange={(ev) => props.onSearchChange(ev.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>
        <Dropdown
          options={deviceOptions}
          value={props.device}
          onChange={props.onDeviceChange}
          placeholder="All Devices"
          triggerClassName="h-8 text-xs py-0"
        />
        <Dropdown
          options={emulatorOptions}
          value={props.emulator}
          onChange={props.onEmulatorChange}
          placeholder="All Emulators"
          triggerClassName="h-8 text-xs py-0"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {hasFilters ? (
          <span>
            {props.listings.pagination.total} of {props.totalCount} listings
          </span>
        ) : (
          <span>{props.totalCount} listings</span>
        )}
      </div>

      {/* Listing Rows */}
      {props.listings.items.length > 0 ? (
        <div className="space-y-1">
          {props.listings.items.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="flex items-center justify-between p-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <GamepadIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate text-gray-900 dark:text-white">{listing.game.title}</span>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {listing.device.brand.name} {listing.device.modelName}
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                {listing.performance.label}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
          {hasFilters ? 'No listings match your filters' : 'No listings yet'}
        </p>
      )}

      {/* Pagination */}
      {props.listings.pagination.pages > 1 && (
        <Pagination
          page={props.page}
          totalPages={props.listings.pagination.pages}
          totalItems={props.listings.pagination.total}
          itemsPerPage={props.listings.pagination.limit}
          onPageChange={props.onPageChange}
        />
      )}
    </div>
  )
}

export default UserActivityListingsTab
