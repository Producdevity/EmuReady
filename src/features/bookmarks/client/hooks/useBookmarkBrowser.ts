'use client'

import { useState } from 'react'
import { type z } from 'zod'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'

const initialFilters = BookmarkFiltersSchema.parse({})
const initialMemoryDrafts = { memoryMin: '', memoryMax: '' }

function parseMemoryDraft(field: keyof typeof initialMemoryDrafts, value: string) {
  return BookmarkFiltersSchema.shape[field].safeParse(value.trim() ? Number(value) : null)
}

export function useBookmarkBrowser() {
  const [variant, setVariant] = useState<'handheld' | 'pc'>('handheld')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [memoryDrafts, setMemoryDrafts] = useState(initialMemoryDrafts)
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
    if (value === variant) return
    setVariant(value)
    setPage(1)
    setSearch('')
    setMemoryDrafts(initialMemoryDrafts)
    setFilters((current) => ({
      ...current,
      deviceIds: [],
      socIds: [],
      cpuIds: [],
      gpuIds: [],
      memoryMin: null,
      memoryMax: null,
    }))
  }

  function clearFilters() {
    setSearch('')
    setMemoryDrafts(initialMemoryDrafts)
    setFilters(initialFilters)
    setPage(1)
  }

  function changeMemory(field: keyof typeof initialMemoryDrafts, value: string) {
    setMemoryDrafts((current) => ({ ...current, [field]: value }))
    const parsed = parseMemoryDraft(field, value)
    if (!parsed.success) return
    setFilters((current) => ({ ...current, [field]: parsed.data }))
    setPage(1)
  }

  const memoryErrors = {
    memoryMin: !parseMemoryDraft('memoryMin', memoryDrafts.memoryMin).success,
    memoryMax: !parseMemoryDraft('memoryMax', memoryDrafts.memoryMax).success,
  }

  const hasFilters = Boolean(
    search ||
      Object.values(memoryDrafts).some(Boolean) ||
      Object.values(filters).some(
        (value) => (Array.isArray(value) && value.length) || typeof value === 'number',
      ),
  )

  return {
    variant,
    page,
    setPage,
    search,
    debouncedSearch: search === '' ? '' : debouncedSearch,
    memoryDrafts,
    memoryErrors,
    changeMemory,
    filters,
    hasFilters,
    changeVariant,
    changeFilters,
    changeSearch,
    clearFilters,
  }
}
