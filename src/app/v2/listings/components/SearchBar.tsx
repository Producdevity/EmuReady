'use client'

import { Filter, Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
}

export function SearchBar(props: Props) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        placeholder="Search games, devices, emulators..."
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
        className="pl-10 pr-12 h-12 text-base rounded-xl border-2 focus:border-blue-500 dark:focus:border-blue-400"
      />
      <Button
        variant={props.showFilters ? 'default' : 'outline'}
        size="sm"
        onClick={props.onToggleFilters}
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
      >
        <Filter className="w-4 h-4 mr-1" />
        Filters
      </Button>
    </div>
  )
}
