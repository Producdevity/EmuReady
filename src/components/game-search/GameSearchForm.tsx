'use client'

import { motion } from 'framer-motion'
import { Search, Info, Database, Gamepad2, Globe } from 'lucide-react'
import {
  useState,
  useEffect,
  useMemo,
  type ComponentType,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Button, Input, Autocomplete, Badge } from '@/components/ui'
import { PLATFORM_MAPPINGS, type PlatformKey } from '@/data/constants'
import type { GameSearchFormProps, GameProvider } from './types'
import type { AutocompleteOptionBase } from '@/components/ui/form/Autocomplete'

interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
}

const providerConfig: Record<
  GameProvider,
  {
    badge: string
    badgeVariant: 'info' | 'success' | 'warning'
    icon: ComponentType<{ className?: string }>
    description: string
    platformKey: 'igdb' | 'tgdb' | 'rawg'
  }
> = {
  igdb: {
    badge: 'IGDB API',
    badgeVariant: 'info',
    icon: Database,
    description: "Search IGDB's comprehensive database with enhanced metadata and image options",
    platformKey: 'igdb',
  },
  tgdb: {
    badge: 'TheGamesDB',
    badgeVariant: 'success',
    icon: Gamepad2,
    description: 'Search TheGamesDB for community-sourced game information',
    platformKey: 'tgdb',
  },
  rawg: {
    badge: 'RAWG API',
    badgeVariant: 'warning',
    icon: Globe,
    description: "Search RAWG's extensive video game database",
    platformKey: 'rawg',
  },
}

export function GameSearchForm(props: GameSearchFormProps) {
  const [selectedSystemId, setSelectedSystemId] = useState(props.initialSystemId ?? '')
  const [searchQuery, setSearchQuery] = useState(props.initialQuery ?? '')

  const config = providerConfig[props.provider]
  const Icon = config.icon

  // Sync local state with prop changes
  useEffect(() => {
    setSelectedSystemId(props.initialSystemId ?? '')
  }, [props.initialSystemId])

  useEffect(() => {
    setSearchQuery(props.initialQuery ?? '')
  }, [props.initialQuery])

  const selectedSystem = useMemo(
    () =>
      selectedSystemId ? props.systems.find((system) => system.id === selectedSystemId) : null,
    [selectedSystemId, props.systems],
  )

  const selectedSystemKey = (selectedSystem?.key as PlatformKey) || null

  // Get platform ID for the selected system based on provider
  const platformId = selectedSystemKey
    ? (PLATFORM_MAPPINGS[config.platformKey][selectedSystemKey] ?? null)
    : null

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    const query = searchQuery.trim()
    if (!query || query.length < 2) return
    props.onSearch(query, platformId ?? null, selectedSystemId || null)
  }

  const handleKeyPress = (ev: KeyboardEvent) => {
    if (ev.key !== 'Enter') return
    ev.preventDefault()
    const query = searchQuery.trim()
    if (!query || query.length < 2) return
    props.onSearch(query, platformId ?? null, selectedSystemId || null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Search Settings
            </h2>
          </div>
          <Badge variant={config.badgeVariant} size="sm">
            {config.badge}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{config.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-5">
          {/* System Selection Row */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              System (Optional)
            </label>
            <Autocomplete<SystemOption>
              placeholder="Choose a system to filter results..."
              value={selectedSystemId}
              onChange={(value) => setSelectedSystemId(value ?? '')}
              items={props.systems}
              optionToValue={(option) => option.id}
              optionToLabel={(option) => option.name}
              filterKeys={['name']}
              minCharsToTrigger={0}
              disabled={false}
              className="w-full max-w-md"
            />
            {selectedSystem && platformId && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Platform filter enabled for {selectedSystem.name}
              </p>
            )}
            {selectedSystem && !platformId && (
              <div className="mt-2 max-w-md flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Platform not mapped</p>
                  <p className="text-xs mt-1">
                    This system isn&apos;t mapped to {config.badge}. Search results will include
                    games from all platforms.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Game Title Search Row */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Game Title <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 items-stretch">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter game title (e.g., Mario, Zelda, Pokemon)"
                className="flex-1 max-w-2xl"
                disabled={props.isSearching}
                minLength={2}
                required
              />
              <Button
                type="submit"
                disabled={!searchQuery.trim() || searchQuery.trim().length < 2 || props.isSearching}
                isLoading={props.isSearching}
                className="px-8"
              >
                {props.isSearching ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {props.showModeratorFeatures && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Info className="h-4 w-4" />
              <span>As a moderator, you can access additional features when selecting games.</span>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  )
}
