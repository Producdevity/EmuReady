'use client'

import { Monitor, Search, Smartphone } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { Button, Input, MultiSelect } from '@/components/ui'
import { api } from '@/lib/api'
import { SortDirectionSchema } from '@/schemas/common'
import { emulatorOptions, performanceOptions, systemOptions } from '@/utils/options'
import BookmarkEmptyState from './BookmarkEmptyState'
import BookmarkGrid from './BookmarkGrid'
import BookmarkSubTabButton from './BookmarkSubTabButton'
import NoBookmarksMessage from './NoBookmarksMessage'
import { BookmarkSortFieldSchema } from '../../shared/bookmark-filters.schemas'
import { type useBookmarkBrowser } from '../hooks/useBookmarkBrowser'

interface Props {
  userId: string
  handheldCount: number
  pcCount: number
  ownProfile?: boolean
  browser: ReturnType<typeof useBookmarkBrowser>
  children: ReactNode
}

export default function BookmarkBrowser(props: Props) {
  const browser = props.browser
  const filters = browser.filters
  const sortId = useId()
  const directionId = useId()
  const minMemoryId = useId()
  const maxMemoryId = useId()
  const systems = api.systems.get.useQuery()
  const emulators = api.emulators.get.useQuery({ limit: 100 })
  const performance = api.listings.performanceScales.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <BookmarkSubTabButton
            active={browser.variant === 'handheld'}
            count={props.handheldCount}
            icon={<Smartphone className="size-4" />}
            label="Handheld"
            onClick={() => browser.changeVariant('handheld')}
          />
          <BookmarkSubTabButton
            active={browser.variant === 'pc'}
            count={props.pcCount}
            icon={<Monitor className="size-4" />}
            label="PC"
            onClick={() => browser.changeVariant('pc')}
          />
        </div>
        <Input
          aria-label="Search bookmarks"
          placeholder="Search by game title..."
          value={browser.search}
          onChange={(event) => browser.changeSearch(event.target.value)}
          leftIcon={<Search className="size-4" />}
          containerClassName="w-full sm:w-64"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MultiSelect
          label="Systems"
          value={filters.systemIds}
          options={systemOptions(systems.data ?? [])}
          onChange={(systemIds) => browser.changeFilters({ ...filters, systemIds })}
          maxDisplayed={1}
          placeholder="All systems"
        />
        <MultiSelect
          label="Emulators"
          value={filters.emulatorIds}
          options={emulatorOptions(emulators.data?.emulators ?? [])}
          onChange={(emulatorIds) => browser.changeFilters({ ...filters, emulatorIds })}
          maxDisplayed={1}
          placeholder="All emulators"
        />
        <MultiSelect
          label="Performance"
          value={filters.performanceIds.map(String)}
          options={performanceOptions(performance.data ?? [])}
          onChange={(values) =>
            browser.changeFilters({ ...filters, performanceIds: values.map(Number) })
          }
          maxDisplayed={1}
          placeholder="All performance levels"
        />
        {props.children}
        {browser.variant === 'pc' && (
          <>
            <div>
              <label htmlFor={minMemoryId} className="block mb-1 text-sm font-medium">
                Minimum memory (GB)
              </label>
              <Input
                id={minMemoryId}
                type="number"
                min={1}
                step={1}
                value={browser.memoryDrafts.memoryMin}
                onChange={(event) => browser.changeMemory('memoryMin', event.target.value)}
                aria-invalid={browser.memoryErrors.memoryMin || undefined}
                aria-describedby={
                  browser.memoryErrors.memoryMin ? `${minMemoryId}-error` : undefined
                }
              />
              {browser.memoryErrors.memoryMin && (
                <p
                  id={`${minMemoryId}-error`}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  Enter a positive whole number.
                </p>
              )}
            </div>
            <div>
              <label htmlFor={maxMemoryId} className="block mb-1 text-sm font-medium">
                Maximum memory (GB)
              </label>
              <Input
                id={maxMemoryId}
                type="number"
                min={1}
                step={1}
                value={browser.memoryDrafts.memoryMax}
                onChange={(event) => browser.changeMemory('memoryMax', event.target.value)}
                aria-invalid={browser.memoryErrors.memoryMax || undefined}
                aria-describedby={
                  browser.memoryErrors.memoryMax ? `${maxMemoryId}-error` : undefined
                }
              />
              {browser.memoryErrors.memoryMax && (
                <p
                  id={`${maxMemoryId}-error`}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  Enter a positive whole number.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1 sm:flex-none">
          <label htmlFor={sortId} className="block mb-1 text-sm font-medium">
            Sort by
          </label>
          <Input
            id={sortId}
            as="select"
            value={filters.sortField}
            onChange={(event) =>
              browser.changeFilters({
                ...filters,
                sortField: BookmarkSortFieldSchema.parse(event.target.value),
              })
            }
          >
            <option value="savedAt">Date bookmarked</option>
            <option value="title">Game title</option>
            <option value="performance">Performance rank</option>
            <option value="successRate">Community success rate</option>
          </Input>
        </div>
        <div className="min-w-36 flex-1 sm:flex-none">
          <label htmlFor={directionId} className="block mb-1 text-sm font-medium">
            Direction
          </label>
          <Input
            id={directionId}
            as="select"
            value={filters.sortDirection}
            onChange={(event) =>
              browser.changeFilters({
                ...filters,
                sortDirection: SortDirectionSchema.parse(event.target.value),
              })
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Input>
        </div>
        {browser.hasFilters && (
          <Button variant="outline" onClick={browser.clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <BookmarkGrid
        variant={browser.variant}
        userId={props.userId}
        page={browser.page}
        limit={12}
        search={browser.debouncedSearch}
        filters={filters}
        hasFilters={browser.hasFilters}
        onPageChange={browser.setPage}
        emptyContent={
          props.ownProfile ? (
            <BookmarkEmptyState
              listingType={browser.variant === 'handheld' ? 'handheld' : 'PC'}
              browseHref={browser.variant === 'handheld' ? '/listings' : '/pc-listings'}
            />
          ) : (
            <NoBookmarksMessage />
          )
        }
      />
    </div>
  )
}
