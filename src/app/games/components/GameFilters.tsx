'use client'

import { Input, SelectInput } from '@/components/ui'
import { CpuChipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
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
      <Input
        leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
        type="text"
        placeholder="Search games..."
        value={props.search}
        onChange={props.onSearchChange}
        className="flex-1"
      />

      <SelectInput
        label="System"
        hideLabel
        leftIcon={<CpuChipIcon className="w-5 h-5" />}
        value={props.systemId}
        onChange={props.onSystemChange}
        options={props.systems?.map(({ id, name }) => ({ id, name })) ?? []}
      />
    </div>
  )
}

export default GameFilters
