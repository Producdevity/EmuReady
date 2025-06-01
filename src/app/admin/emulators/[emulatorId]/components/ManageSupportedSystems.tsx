'use client'

import { useState, useEffect, useMemo } from 'react'
import { type System } from '@orm'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import toast from '@/lib/toast'
import { Input } from '@/components/ui'
import { type RouterInput } from '@/types/trpc'

interface Props {
  emulatorId: string
  allSystems: System[]
  currentlySupportedSystems: Pick<System, 'id' | 'name'>[]
}

function ManageSupportedSystems(props: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSystemIds, setSelectedSystemIds] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    setSelectedSystemIds(
      new Set(props.currentlySupportedSystems.map((s) => s.id)),
    )
  }, [props.currentlySupportedSystems])

  const filteredSystems = useMemo(
    () =>
      props.allSystems
        .filter((system) =>
          system.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => {
          const aSelected = selectedSystemIds.has(a.id) ? -1 : 1
          const bSelected = selectedSystemIds.has(b.id) ? -1 : 1
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
          if (aSelected !== bSelected) return aSelected
          if (aName < bName) return -1
          if (aName > bName) return 1
          return 0
        }),
    [props.allSystems, searchQuery, selectedSystemIds],
  )

  const utils = api.useUtils()
  const updateMutation = api.emulators.updateSupportedSystems.useMutation({
    onSuccess: async () => {
      toast.success('Supported systems updated successfully!')
      await utils.emulators.byId.invalidate({ id: props.emulatorId })
    },
    onError: (error) => {
      toast.error(`Error updating systems: ${error.message}`)
      console.error('Error updating supported systems:', error)
    },
  })

  const handleCheckboxChange = (systemId: string, isChecked: boolean) => {
    setSelectedSystemIds((prev) => {
      const newSet = new Set(prev)
      if (isChecked) {
        newSet.add(systemId)
      } else {
        newSet.delete(systemId)
      }
      return newSet
    })
  }

  const handleSaveChanges = () => {
    updateMutation.mutate({
      emulatorId: props.emulatorId,
      systemIds: Array.from(selectedSystemIds),
    } satisfies RouterInput['emulators']['updateSupportedSystems'])
  }

  if (!props.allSystems || props.allSystems.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        No systems available in the database to assign.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Input
          placeholder="Search systems..."
          className="w-full"
          value={searchQuery}
          onChange={(ev) => setSearchQuery(ev.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto p-1 border dark:border-gray-700 rounded-md">
        {filteredSystems.map((system) => (
          <div
            key={system.id}
            className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/70 transition-colors duration-150"
          >
            <input
              type="checkbox"
              id={`system-checkbox-${system.id}`}
              checked={selectedSystemIds.has(system.id)}
              onChange={(e) =>
                handleCheckboxChange(system.id, e.target.checked)
              }
              className="mr-3 h-5 w-5 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 rounded bg-white dark:bg-gray-700 cursor-pointer"
            />
            <label
              htmlFor={`system-checkbox-${system.id}`}
              className="text-sm font-medium text-gray-800 dark:text-gray-100 cursor-pointer select-none flex-grow truncate"
              title={system.name}
            >
              {system.name}
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-8 pt-6 border-t dark:border-gray-700">
        <Button
          onClick={handleSaveChanges}
          isLoading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          variant="primary"
          size="lg"
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
export default ManageSupportedSystems
