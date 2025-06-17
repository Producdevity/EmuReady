'use client'

import { Joystick, Search, Filter } from 'lucide-react'
import { type ChangeEvent, type SyntheticEvent } from 'react'
import { Input, SelectInput } from '@/components/ui'

interface Props {
  search: string
  systemId: string
  hideGamesWithNoListings: boolean
  systems: Array<{ id: string; name: string }> | undefined
  onSearchChange: (ev: ChangeEvent<HTMLInputElement>) => void
  onSystemChange: (ev: SyntheticEvent) => void
  onHideGamesWithNoListingsChange: (hide: boolean) => void
}

function GameFilters(props: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <Input
        leftIcon={<Search className="w-5 h-5" />}
        type="text"
        placeholder="Search games..."
        value={props.search}
        onChange={props.onSearchChange}
        className="flex-1"
      />

      <SelectInput
        label="System"
        hideLabel
        leftIcon={<Joystick className="w-5 h-5" />}
        value={props.systemId}
        onChange={props.onSystemChange}
        options={props.systems?.map(({ id, name }) => ({ id, name })) ?? []}
      />

      <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <Filter className="w-4 h-4" />
        <input
          type="checkbox"
          checked={props.hideGamesWithNoListings}
          onChange={(e) =>
            props.onHideGamesWithNoListingsChange(e.target.checked)
          }
          className="rounded border-gray-300 dark:border-gray-600"
        />
        <span>Hide games with no listings</span>
      </label>
    </div>
  )
}

export default GameFilters
