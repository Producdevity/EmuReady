'use client'

import { useState } from 'react'
import { z } from 'zod'
import { UI_CONSTANTS } from '@/data/constants'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import {
  BookmarkFiltersSchema,
  refineBookmarkMemoryRange,
} from '../../shared/bookmark-filters.schemas'

const initialFilters = BookmarkFiltersSchema.parse({})
const initialMemoryDrafts = { memoryMin: '', memoryMax: '' }
const memoryDraftSchema = BookmarkFiltersSchema.pick({
  memoryMin: true,
  memoryMax: true,
}).superRefine(refineBookmarkMemoryRange)

function parseMemoryDrafts(drafts: typeof initialMemoryDrafts) {
  return memoryDraftSchema.safeParse({
    memoryMin: drafts.memoryMin.trim() ? Number(drafts.memoryMin) : null,
    memoryMax: drafts.memoryMax.trim() ? Number(drafts.memoryMax) : null,
  })
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
    const nextDrafts = { ...memoryDrafts, [field]: value }
    setMemoryDrafts(nextDrafts)
    const fieldValue = BookmarkFiltersSchema.shape[field].safeParse(
      value.trim() ? Number(value) : null,
    )
    if (!fieldValue.success) return
    const otherField = field === 'memoryMin' ? 'memoryMax' : 'memoryMin'
    const otherDraft = nextDrafts[otherField].trim()
    const otherValue = BookmarkFiltersSchema.shape[otherField].safeParse(
      otherDraft ? Number(otherDraft) : null,
    )
    const applied = otherValue.success
      ? parseMemoryDrafts(nextDrafts)
      : memoryDraftSchema.safeParse({ ...filters, [field]: fieldValue.data })
    if (!applied.success) return
    setFilters((current) => ({ ...current, ...applied.data }))
    setPage(1)
  }

  const memoryValidation = parseMemoryDrafts(memoryDrafts)
  function memoryError(field: keyof typeof initialMemoryDrafts) {
    if (memoryValidation.success) return undefined
    const issue = memoryValidation.error.issues.find((issue) => issue.path[0] === field)
    if (!issue) return undefined
    return issue.code === z.ZodIssueCode.custom ? issue.message : 'Enter a positive whole number.'
  }

  const memoryErrors = {
    memoryMin: memoryError('memoryMin'),
    memoryMax: memoryError('memoryMax'),
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
