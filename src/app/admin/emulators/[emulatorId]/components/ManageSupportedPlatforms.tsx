'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge, Button, Input } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PlatformScope } from '@orm'

type Platform = RouterOutput['platforms']['get'][number]

interface Props {
  emulatorId: string
  allPlatforms: Platform[]
  currentlySupportedPlatformIds: string[]
}

const SCOPE_ORDER: PlatformScope[] = [
  PlatformScope.DESKTOP,
  PlatformScope.UNIVERSAL,
  PlatformScope.MOBILE,
]

const SCOPE_BADGE: Record<
  PlatformScope,
  { label: string; variant: 'info' | 'success' | 'primary' }
> = {
  [PlatformScope.DESKTOP]: { label: 'Desktop', variant: 'info' },
  [PlatformScope.UNIVERSAL]: { label: 'Universal', variant: 'primary' },
  [PlatformScope.MOBILE]: { label: 'Mobile', variant: 'success' },
}

function ManageSupportedPlatforms(props: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSelectedPlatformIds(new Set(props.currentlySupportedPlatformIds))
  }, [props.currentlySupportedPlatformIds])

  const groupedPlatforms = useMemo(() => {
    const normalized = searchQuery.toLowerCase()
    const filtered = props.allPlatforms.filter((p) => p.name.toLowerCase().includes(normalized))
    const groups = new Map<PlatformScope, Platform[]>()
    for (const scope of SCOPE_ORDER) groups.set(scope, [])
    for (const platform of filtered) {
      const bucket = groups.get(platform.scope)
      if (bucket) bucket.push(platform)
    }
    return SCOPE_ORDER.map((scope) => ({ scope, platforms: groups.get(scope) ?? [] })).filter(
      (group) => group.platforms.length > 0,
    )
  }, [props.allPlatforms, searchQuery])

  const utils = api.useUtils()
  const updateMutation = api.emulators.updateSupportedPlatforms.useMutation({
    onSuccess: async () => {
      toast.success('Supported platforms updated successfully!')
      await utils.emulators.byId.invalidate({ id: props.emulatorId })
    },
    onError: (error) => {
      toast.error(`Error updating platforms: ${getErrorMessage(error)}`)
      console.error('Error updating supported platforms:', error)
    },
  })

  const handleCheckboxChange = (platformId: string, isChecked: boolean) => {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev)
      if (isChecked) next.add(platformId)
      else next.delete(platformId)
      return next
    })
  }

  const handleSaveChanges = () => {
    updateMutation.mutate({
      emulatorId: props.emulatorId,
      platformIds: Array.from(selectedPlatformIds),
    } satisfies RouterInput['emulators']['updateSupportedPlatforms'])
  }

  if (!props.allPlatforms || props.allPlatforms.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        No platforms available in the database. Run the platforms seeder.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Input
          placeholder="Search platforms..."
          className="w-full"
          value={searchQuery}
          onChange={(ev) => setSearchQuery(ev.target.value)}
        />
      </div>

      <div className="space-y-6">
        {groupedPlatforms.map(({ scope, platforms }) => (
          <div key={scope}>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={SCOPE_BADGE[scope].variant} size="sm" pill>
                {SCOPE_BADGE[scope].label}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {platforms.length} platform{platforms.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {platforms.map((platform) => {
                const checked = selectedPlatformIds.has(platform.id)
                return (
                  <label
                    key={platform.id}
                    htmlFor={`platform-checkbox-${platform.id}`}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/70 transition-colors duration-150 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`platform-checkbox-${platform.id}`}
                      checked={checked}
                      onChange={(e) => handleCheckboxChange(platform.id, e.target.checked)}
                      className="mr-3 h-5 w-5 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 rounded bg-white dark:bg-gray-700 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-grow truncate">
                      {platform.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-mono">
                      {platform.slug}
                    </span>
                  </label>
                )
              })}
            </div>
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

export default ManageSupportedPlatforms
