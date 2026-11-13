'use client'

import { useState } from 'react'
import { type z } from 'zod'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'

const initialFilters = BookmarkFiltersSchema.parse({})

export function useBookmarkBrowser() {
  const [variant, setVariant] = useState<'handheld' | 'pc'>('handheld')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const debouncedSearch = useDebouncedValue(search, UI_CONSTANTS.DEBOUNCE_DELAY)

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeFilters(value: z.output<typeof BookmarkFiltersSchema>) {
    setFilters(value)
    setPage(1)
  }

  function changeVariant(value: typeof variant) {
    setVariant(value)
    setPage(1)
    setSearch('')
    setFilters(initialFilters)
  }

  function clearFilters() {
    setSearch('')
    setFilters(initialFilters)
    setPage(1)
  }

  const hasFilters = Boolean(
    search ||
      Object.values(filters).some(
        (value) => (Array.isArray(value) && value.length) || typeof value === 'number',
      ),
  )

  return {
    variant,
    page,
    setPage,
    search,
    debouncedSearch,
    filters,
    hasFilters,
    changeVariant,
    changeFilters,
    changeSearch,
    clearFilters,
  }
}
