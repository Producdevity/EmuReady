import { useState, type ChangeEvent } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface UseAdminTableOptions<TSortField extends string> {
  defaultLimit?: number
  defaultSortField?: TSortField | null
  defaultSortDirection?: SortDirection
}

export interface UseAdminTableReturn<TSortField extends string> {
  // Search state
  search: string
  setSearch: (search: string) => void
  handleSearchChange: (ev: ChangeEvent<HTMLInputElement>) => void

  // Pagination state
  page: number
  setPage: (page: number) => void
  limit: number

  // Sorting state
  sortField: TSortField | null
  setSortField: (field: TSortField | null) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
  handleSort: (field: string) => void

  resetFilters: () => void
}

const DEFAULT_LIMIT = 20

function useAdminTable<TSortField extends string>(
  opts: UseAdminTableOptions<TSortField> = {},
): UseAdminTableReturn<TSortField> {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<TSortField | null>(
    opts.defaultSortField ?? null,
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    opts.defaultSortDirection ?? null,
  )

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value)
    setPage(1)
  }

  const handleSort = (field: string) => {
    let newSortField: TSortField | null = sortField
    let newSortDirection: SortDirection

    if (sortField === field) {
      if (sortDirection === 'asc') {
        newSortDirection = 'desc'
      } else if (sortDirection === 'desc') {
        newSortField = null
        newSortDirection = null
      } else {
        newSortDirection = 'asc'
      }
    } else {
      newSortField = field as TSortField
      newSortDirection = 'asc'
    }

    setSortField(newSortField)
    setSortDirection(newSortDirection)
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setPage(1)
    setSortField(opts.defaultSortField ?? null)
    setSortDirection(opts.defaultSortDirection ?? null)
  }

  return {
    search,
    setSearch,
    handleSearchChange,
    page,
    setPage,
    limit: opts.defaultLimit ?? DEFAULT_LIMIT,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    handleSort,
    resetFilters,
  }
}

export default useAdminTable
