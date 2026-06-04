'use client'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import AsyncMultiSelect from '@/components/ui/form/async-multi-select/AsyncMultiSelect'
import { CACHE_DURATIONS } from '@/data/constants'
import { api } from '@/lib/api'

interface Props {
  label: string
  leftIcon?: ReactNode
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  maxDisplayed?: number
}

const PAGE_SIZE = 50
const LOOKUP_DATA_QUERY_OPTIONS = {
  staleTime: CACHE_DURATIONS.SIX_HOURS,
  gcTime: CACHE_DURATIONS.TWELVE_HOURS,
}

export default function AsyncDeviceFilterSelect(props: Props) {
  const [query, setQuery] = useState('')
  const [pageOffsets, setPageOffsets] = useState([0])

  const byIdsQuery = api.devices.getByIds.useQuery(
    { ids: props.value },
    { ...LOOKUP_DATA_QUERY_OPTIONS, enabled: props.value.length > 0 },
  )

  const pageQueries = api.useQueries((t) =>
    pageOffsets.map((offset) =>
      t.devices.options(
        { search: query || undefined, limit: PAGE_SIZE, offset },
        LOOKUP_DATA_QUERY_OPTIONS,
      ),
    ),
  )

  const options = useMemo(
    () =>
      pageQueries.flatMap((pageQuery) =>
        (pageQuery.data?.devices ?? []).map((d) => ({
          id: d.id,
          name: `${d.brand.name} ${d.modelName}`,
          badgeName: d.modelName,
        })),
      ),
    [pageQueries],
  )

  const selectedByIds = useMemo(
    () =>
      (byIdsQuery.data ?? []).map((d) => ({
        id: d.id,
        name: `${d.brand.name} ${d.modelName}`,
        badgeName: d.modelName,
      })),
    [byIdsQuery.data],
  )

  const lastPageQuery = pageQueries[pageQueries.length - 1]
  const hasMore = lastPageQuery?.data?.hasMore ?? false
  const isFetching = pageQueries.some((pageQuery) => pageQuery.isFetching)

  const handleLoadMore = useCallback(() => {
    setPageOffsets((offsets) => [...offsets, offsets[offsets.length - 1] + PAGE_SIZE])
  }, [])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    setPageOffsets([0])
  }, [])

  return (
    <AsyncMultiSelect
      {...props}
      options={options}
      selectedByIds={selectedByIds}
      isFetching={isFetching}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      onQueryChange={handleQueryChange}
    />
  )
}
