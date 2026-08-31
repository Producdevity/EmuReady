'use client'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import AsyncMultiSelect, {
  type Option,
} from '@/components/ui/form/async-multi-select/AsyncMultiSelect'
import { LOOKUP_PAGINATION } from '@/data/constants'
import { api } from '@/lib/api'
import { toGpuSelectOption } from '../utils/gpuSelectOption'

interface Props {
  label: string
  leftIcon?: ReactNode
  value: string[]
  onChange: (values: string[], selectedOptions: Option[]) => void
  placeholder?: string
  className?: string
  maxDisplayed?: number
}

export default function AsyncGpuFilterSelect(props: Props) {
  const [query, setQuery] = useState('')
  const [pageOffsets, setPageOffsets] = useState([0])

  const byIdsQuery = api.gpus.getByIds.useQuery(
    { ids: props.value },
    { enabled: props.value.length > 0 },
  )

  const pageQueries = api.useQueries((t) =>
    pageOffsets.map((offset) =>
      t.gpus.options({
        search: query || undefined,
        limit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
        offset,
      }),
    ),
  )

  const options = useMemo(
    () =>
      pageQueries.flatMap((pageQuery) =>
        (pageQuery.data?.gpus ?? []).map((gpu) => toGpuSelectOption(gpu)),
      ),
    [pageQueries],
  )

  const selectedByIds = useMemo(
    () => (byIdsQuery.data ?? []).map((gpu) => toGpuSelectOption(gpu)),
    [byIdsQuery.data],
  )

  const lastPageQuery = pageQueries[pageQueries.length - 1]
  const hasMore = lastPageQuery?.data?.hasMore ?? false
  const isFetching = pageQueries.some((pageQuery) => pageQuery.isFetching)

  const handleLoadMore = useCallback(() => {
    setPageOffsets((offsets) => [
      ...offsets,
      offsets[offsets.length - 1] + LOOKUP_PAGINATION.DEFAULT_LIMIT,
    ])
  }, [])

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery)
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
      searchPlaceholder="Search GPUs..."
    />
  )
}
