'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Button, Input, Autocomplete } from '@/components/ui'
import { Search, Info } from 'lucide-react'
import { api } from '@/lib/api'
import type { AutocompleteOptionBase } from '@/components/ui/Autocomplete'

interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
  tgdbPlatformId?: number | null
}

interface SearchFormProps {
  onSearch: (query: string, platformId?: number) => void
  isSearching: boolean
}

function SearchForm(props: SearchFormProps) {
  const [selectedSystemId, setSelectedSystemId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const systemsQuery = api.systems.get.useQuery()

  const selectedSystem = selectedSystemId
    ? systemsQuery.data?.find((system) => system.id === selectedSystemId)
    : null

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!searchQuery.trim()) return
    props.onSearch(
      searchQuery.trim(),
      selectedSystem?.tgdbPlatformId ?? undefined,
    )
  }

  const handleKeyPress = (ev: KeyboardEvent) => {
    if (ev.key !== 'Enter') return
    ev.preventDefault()
    if (!searchQuery.trim()) return

    props.onSearch(
      searchQuery.trim(),
      selectedSystem?.tgdbPlatformId ?? undefined,
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">
            Search Settings
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select a system and enter a game title to search TheGamesDB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            System (Optional)
          </label>
          <Autocomplete<SystemOption>
            placeholder="Choose a system to filter results..."
            value={selectedSystemId}
            onChange={(value) => setSelectedSystemId(value ?? '')}
            items={systemsQuery.data ?? []}
            optionToValue={(option) => option.id}
            optionToLabel={(option) => option.name}
            filterKeys={['name']}
            minCharsToTrigger={0}
            disabled={systemsQuery.isLoading}
            className="w-full"
          />
          {selectedSystem && !selectedSystem.tgdbPlatformId && (
            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Platform not mapped</p>
                <p>
                  This system isn&apos;t mapped to TheGamesDB. Search results
                  may include games from all platforms.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Game Title
          </label>
          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter game title (e.g., Super Mario Bros, Zelda)"
              className="flex-1"
              disabled={props.isSearching}
            />
            <Button
              type="submit"
              disabled={!searchQuery.trim() || props.isSearching}
              isLoading={props.isSearching}
              className="h-full px-6"
            >
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default SearchForm
