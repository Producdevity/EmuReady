'use client'

import { Input } from '@/components'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { type ChangeEvent, type SyntheticEvent } from 'react'

interface Props {
  search: string
  systemId: string
  systems: Array<{ id: string; name: string }> | undefined
  onSearchChange: (ev: ChangeEvent<HTMLInputElement>) => void
  onSystemChange: (ev: SyntheticEvent) => void
}

function GameFilters(props: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1">
        <Input
          leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          type="text"
          placeholder="Search games..."
          value={props.search}
          onChange={props.onSearchChange}
        />
      </div>
      <div className="w-full sm:w-64">
        <Input
          as="select"
          value={props.systemId}
          onChange={props.onSystemChange}
          className="mb-0"
        >
          <option value="">All Systems</option>
          {props.systems?.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </Input>
      </div>
    </div>
  )
}

export default GameFilters
