'use client'

import { Joystick, Search, Filter } from 'lucide-react'
import { type ChangeEvent } from 'react'
import { Input, Autocomplete } from '@/components/ui'
import type { AutocompleteOptionBase } from '@/components/ui/form/Autocomplete'

interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
}

interface Props {
  search: string
  systemId: string
  hideGamesWithNoListings: boolean
  systems: Array<{ id: string; name: string }> | undefined
  onSearchChange: (ev: ChangeEvent<HTMLInputElement>) => void
  onSystemChange: (value: string | null) => void
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

      <div className="relative">
        <div className="relative flex items-center bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Joystick className="w-5 h-5" />
          </span>
          <Autocomplete<SystemOption>
            placeholder="All systems..."
            value={props.systemId || null}
            onChange={props.onSystemChange}
            items={props.systems ?? []}
            optionToValue={(option) => option.id}
            optionToLabel={(option) => option.name}
            filterKeys={['name']}
            minCharsToTrigger={0}
            className="[&>div]:border-none [&>div]:shadow-none [&>div]:bg-transparent [&_input]:bg-transparent [&_input]:border-none [&_input]:pl-10 [&_input]:shadow-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors shadow-sm">
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
