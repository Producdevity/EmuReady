'use client'

import { type ReactNode, useEffect, useState } from 'react'
import AsyncMultiSelect, {
  type Option,
} from '@/components/ui/form/async-multi-select/AsyncMultiSelect'
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

export default function AsyncSocMultiSelect(props: Props) {
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [options, setOptions] = useState<Option[]>([])
  const [hasMore, setHasMore] = useState(true)

  const byIdsQuery = api.socs.getByIds.useQuery(
    { ids: props.value },
    { enabled: props.value.length > 0, staleTime: 300000 },
  )

  const pageQuery = api.socs.get.useQuery(
    { search: query || undefined, limit: PAGE_SIZE, offset },
    { enabled: true, staleTime: 30000 },
  )

  useEffect(() => {
    if (!pageQuery.data) return
    const { socs, pagination } = pageQuery.data
    const mapped = socs.map((s) => ({
      id: s.id,
      name: `${s.manufacturer} ${s.name}`,
      badgeName: s.name,
    }))
    setOptions((prev) => (offset === 0 ? mapped : [...prev, ...mapped]))
    setHasMore(pagination.page < pagination.pages)
  }, [pageQuery.data, offset])

  const selectedByIds = (byIdsQuery.data || []).map((s) => ({
    id: s.id,
    name: `${s.manufacturer} ${s.name}`,
    badgeName: s.name,
  }))

  return (
    <AsyncMultiSelect
      {...props}
      options={options}
      selectedByIds={selectedByIds}
      isFetching={pageQuery.isFetching}
      hasMore={hasMore}
      onLoadMore={() => setOffset((o) => o + PAGE_SIZE)}
      onQueryChange={(q) => {
        setQuery(q)
        setOffset(0)
        setOptions([])
      }}
    />
  )
}
