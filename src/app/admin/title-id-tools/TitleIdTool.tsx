'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/form/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  TITLE_ID_PLATFORM_IDS,
  type TitleIdPlatformId,
  type TitleIdProviderInfo,
} from '@/schemas/titleId'
import { formatters, getLocale } from '@/utils/date'
import { ms } from '@/utils/time'
import { TitleIdBestMatch } from './components/TitleIdBestMatch'

const EMPTY_PROVIDERS: TitleIdProviderInfo[] = []

function TitleIdTool() {
  const providersQuery = api.titleIdTools.providers.useQuery()
  const [selectedPlatformId, setSelectedPlatformId] = useState<TitleIdPlatformId | null>(null)
  const [gameName, setGameName] = useState('')
  const [maxResults, setMaxResults] = useState<number>(5)

  const providers = providersQuery.data?.providers ?? EMPTY_PROVIDERS

  useEffect(() => {
    if (providers.length === 0) return
    if (selectedPlatformId && providers.some((provider) => provider.id === selectedPlatformId)) {
      return
    }

    const defaultProvider = providers[0]
    if (defaultProvider) setSelectedPlatformId(defaultProvider.id)
  }, [providers, selectedPlatformId])

  const selectedProvider = useMemo(() => {
    if (!selectedPlatformId) return null
    return providers.find((provider) => provider.id === selectedPlatformId) ?? null
  }, [providers, selectedPlatformId])

  const statsQueryEnabled = Boolean(selectedProvider?.supportsStats)

  const statsQuery = api.titleIdTools.stats.useQuery(
    { platformId: selectedProvider?.id ?? providers[0]?.id ?? TITLE_ID_PLATFORM_IDS[0] },
    {
      enabled: statsQueryEnabled && Boolean(selectedProvider?.id),
      staleTime: ms.minutes(15),
    },
  )

  const utils = api.useUtils()

  const searchMutation = api.titleIdTools.search.useMutation({
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to search for title IDs'
      toast.error(message)
    },
    onSuccess: () => {
      utils.titleIdTools.stats.invalidate().catch(console.error)
    },
  })

  const isSearching = searchMutation.isPending
  const latestResults = searchMutation.data?.results ?? []
  const bestMatch = searchMutation.data?.bestMatch ?? null

  const canSearch = useMemo(() => {
    return Boolean(selectedPlatformId && gameName.trim().length >= 2)
  }, [selectedPlatformId, gameName])

  function handlePlatformChange(value: string) {
    if (TITLE_ID_PLATFORM_IDS.includes(value as TitleIdPlatformId)) {
      return setSelectedPlatformId(value as TitleIdPlatformId)
    }

    toast.error('Unsupported title ID provider selected')
  }

  function handleMaxResultsChange(value: string) {
    const nextValue = Number.parseInt(value, 10)
    if (Number.isNaN(nextValue)) return setMaxResults(5)

    const bounded = Math.min(Math.max(nextValue, 1), 20)
    setMaxResults(bounded)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlatformId) {
      toast.error('Select a title ID provider before searching')
      return
    }

    const trimmedName = gameName.trim()
    if (trimmedName.length < 2) {
      toast.error('Enter at least two characters to search')
      return
    }

    searchMutation.mutate({
      platformId: selectedPlatformId,
      gameName: trimmedName,
      maxResults,
    })
  }

  if (providersQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!selectedProvider) {
    return (
      <Card>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No title ID providers are currently configured.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="md:w-1/3">
            <Dropdown
              options={providers.map((provider) => ({
                value: provider.id,
                label: provider.label,
              }))}
              value={selectedPlatformId ?? undefined}
              onChange={handlePlatformChange}
              label="Title ID Provider"
              placeholder="Select a provider"
            />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedProvider.label}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedProvider.description}
            </p>
          </div>
          {statsQueryEnabled && (
            <div className="md:w-1/3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {statsQuery.isPending ? (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : statsQuery.data ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Titles cached</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {statsQuery.data.totalGames.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Cache status</span>
                    <span className="capitalize font-medium text-gray-900 dark:text-gray-100">
                      {statsQuery.data.cacheStatus}
                    </span>
                  </div>
                  {statsQuery.data.lastUpdated && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {formatters.timeAgo(statsQuery.data.lastUpdated, getLocale())}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unable to load provider statistics.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-[1fr_minmax(120px,180px)_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Game name
              </label>
              <Input
                placeholder="Enter a game title..."
                value={gameName}
                onChange={(event) => setGameName(event.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max results
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={maxResults}
                onChange={(event) => handleMaxResultsChange(event.target.value)}
              />
            </div>
            <div className="flex md:justify-end">
              <Button type="submit" disabled={!canSearch || isSearching} isLoading={isSearching}>
                Search
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        {isSearching ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : latestResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchMutation.data
                ? 'No matching titles were found for the provided query.'
                : 'Run a search to see title IDs and scoring details.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bestMatch && <TitleIdBestMatch titleIdResult={bestMatch} />}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Title ID
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Normalized
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Score
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Region
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Product Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latestResults.map((result, index) => {
                    const isHighlighted = bestMatch?.titleId === result.titleId
                    return (
                      <tr
                        key={`${result.providerId}-${result.titleId}`}
                        className={cn(
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50 dark:bg-gray-800/80',
                          isHighlighted
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100'
                            : 'text-gray-900 dark:text-gray-100',
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{result.titleId}</td>
                        <td className="px-4 py-3">{result.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {result.normalizedTitle}
                        </td>
                        <td className="px-4 py-3">{result.score}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {result.region ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {result.productCode ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <details className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                View raw response data
              </summary>
              <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950">
                <pre className="whitespace-pre-wrap break-all text-xs text-gray-800 dark:text-gray-200">
                  {JSON.stringify(searchMutation.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TitleIdTool
