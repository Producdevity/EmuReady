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

export default function AsyncDeviceMultiSelect(props: Props) {
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [options, setOptions] = useState<Option[]>([])
  const [hasMore, setHasMore] = useState(true)

  const byIdsQuery = api.devices.getByIds.useQuery(
    { ids: props.value },
    { enabled: props.value.length > 0, staleTime: 300000 },
  )

  const pageQuery = api.devices.get.useQuery(
    { search: query || undefined, limit: PAGE_SIZE, offset },
    { enabled: true, staleTime: 30000 },
  )

  useEffect(() => {
    if (!pageQuery.data) return
    const { devices, pagination } = pageQuery.data
    const mapped = devices.map((d) => ({
      id: d.id,
      name: `${d.brand.name} ${d.modelName}`,
      badgeName: d.modelName,
    }))
    setOptions((prev) => (offset === 0 ? mapped : [...prev, ...mapped]))
    setHasMore(pagination.page < pagination.pages)
  }, [pageQuery.data, offset])

  const selectedByIds = (byIdsQuery.data || []).map((d) => ({
    id: d.id,
    name: `${d.brand.name} ${d.modelName}`,
    badgeName: d.modelName,
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
