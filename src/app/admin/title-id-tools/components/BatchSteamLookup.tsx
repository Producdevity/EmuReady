'use client'

import { Copy, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type FormEvent, useState, useMemo } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import { solarizedDarkAtom, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/form/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'

SyntaxHighlighter.registerLanguage('json', json)

const SAMPLE_STEAM_APP_IDS = `220
500
550
730
440
570
10
70
80
240`

interface BatchResult {
  steamAppId: string
  game: {
    id: string
    title: string
    _count: { listings: number }
  } | null
  matchStrategy: 'metadata' | 'exact' | 'normalized' | 'not_found'
}

export function BatchSteamLookup() {
  const { resolvedTheme } = useTheme()
  const [steamAppIds, setSteamAppIds] = useState('')
  const [emulatorName, setEmulatorName] = useState('')
  const [maxListingsPerGame, setMaxListingsPerGame] = useState(1)
  const [showNsfw, setShowNsfw] = useState(false)
  const [minimal, setMinimal] = useState(true)

  const [queryInput, setQueryInput] = useState<{
    steamAppIds: string[]
    emulatorName?: string
    maxListingsPerGame?: number
    showNsfw?: boolean
    minimal?: boolean
  } | null>(null)

  const batchLookupQuery = api.mobile.games.batchBySteamAppIds.useQuery(
    queryInput ?? { steamAppIds: [] },
    { enabled: queryInput !== null },
  )

  const isLoading = batchLookupQuery.isFetching
  const responseData = batchLookupQuery.data

  // Type guard for successful response
  const isSuccessResponse = (
    data: unknown,
  ): data is {
    success: true
    results: BatchResult[]
    totalRequested: number
    totalFound: number
    totalNotFound: number
  } => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      data.success === true &&
      'results' in data &&
      Array.isArray(data.results)
    )
  }

  const isSuccess = isSuccessResponse(responseData)
  const results = isSuccess ? responseData.results : []

  const parsedIds = useMemo(() => {
    return steamAppIds
      .split(/[\n,;]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && /^\d+$/.test(id))
  }, [steamAppIds])

  const canSubmit = parsedIds.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (parsedIds.length === 0) {
      toast.error('Enter at least one Steam App ID')
      return
    }

    if (parsedIds.length > 1000) {
      toast.error('Maximum 1000 Steam App IDs per request')
      return
    }

    setQueryInput({
      steamAppIds: parsedIds,
      emulatorName: emulatorName.trim() || undefined,
      maxListingsPerGame,
      showNsfw,
      minimal,
    })
  }

  function handleUseSampleIds() {
    setSteamAppIds(SAMPLE_STEAM_APP_IDS)
    toast.success('Sample Steam App IDs loaded')
  }

  async function handleCopyResults() {
    if (!results.length) return

    const textResults = results
      .map((result) => {
        if (!result.game) {
          return `${result.steamAppId}: NOT FOUND`
        }
        return `${result.steamAppId}: ${result.game.title} (${result.matchStrategy}, ${result.game._count.listings} listings)`
      })
      .join('\n')

    await navigator.clipboard.writeText(textResults)
    toast.success('Results copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Batch Steam App ID Lookup
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Test the batch lookup endpoint with up to 1000 Steam App IDs. Enter IDs one per line
              or comma-separated.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Steam App IDs
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUseSampleIds}
                    className="text-xs"
                  >
                    <Sparkles className="h-3 w-3" />
                    Use sample IDs
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  rows={10}
                  placeholder="220&#10;500&#10;550&#10;730&#10;..."
                  value={steamAppIds}
                  onChange={(e) => setSteamAppIds(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {parsedIds.length} valid ID{parsedIds.length !== 1 ? 's' : ''} detected
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Emulator Name (optional)
                  </label>
                  <Input
                    placeholder="e.g., GameHub"
                    value={emulatorName}
                    onChange={(e) => setEmulatorName(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Filter listings by emulator name
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Listings Per Game: {maxListingsPerGame}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={maxListingsPerGame}
                    onChange={(e) => setMaxListingsPerGame(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Limit listings returned per game (1-50)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showNsfw"
                    checked={showNsfw}
                    onChange={(e) => setShowNsfw(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <label htmlFor="showNsfw" className="text-sm text-gray-700 dark:text-gray-300">
                    Include NSFW games
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="minimal"
                    checked={minimal}
                    onChange={(e) => setMinimal(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <label htmlFor="minimal" className="text-sm text-gray-700 dark:text-gray-300">
                    Minimal response (essential fields only)
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Lookup {parsedIds.length} Steam App ID{parsedIds.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>

      {isSuccess && responseData && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance Metrics
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {responseData.totalFound}/{responseData.totalRequested}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Games Found</div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {responseData.totalNotFound}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Not Found</div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {results.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Results</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {batchLookupQuery.data
                ? 'No results to display.'
                : 'Enter Steam App IDs and click lookup to see results.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
              <Button variant="ghost" size="sm" onClick={handleCopyResults}>
                <Copy className="h-4 w-4" />
                Copy Results
              </Button>
            </div>

            {!minimal && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Steam App ID
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Game Title
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Match Strategy
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Listings
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => {
                        const isFound = result.game !== null
                        return (
                          <tr
                            key={`${result.steamAppId}-${index}`}
                            className={cn(
                              index % 2 === 0
                                ? 'bg-white dark:bg-gray-900'
                                : 'bg-gray-50 dark:bg-gray-800/80',
                              'text-gray-900 dark:text-gray-100',
                            )}
                          >
                            <td className="px-4 py-3 font-mono text-xs">{result.steamAppId}</td>
                            <td className="px-4 py-3">
                              {isFound && result.game ? (
                                <span>{result.game.title}</span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 italic">
                                  Not found
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                  result.matchStrategy === 'metadata' &&
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                  result.matchStrategy === 'exact' &&
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                                  result.matchStrategy === 'normalized' &&
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                                  result.matchStrategy === 'not_found' &&
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                                )}
                              >
                                {result.matchStrategy}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isFound && result.game ? (
                                <span className="text-gray-900 dark:text-gray-100">
                                  {result.game._count.listings}
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <details className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                View raw response data
              </summary>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <SyntaxHighlighter
                  language="json"
                  style={resolvedTheme === 'dark' ? solarizedDarkAtom : solarizedlight}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    borderRadius: 0,
                    fontSize: '0.75rem',
                    maxHeight: '400px',
                    overflow: 'auto',
                  }}
                  showLineNumbers={false}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {JSON.stringify(batchLookupQuery.data, null, 2)}
                </SyntaxHighlighter>
              </div>
            </details>
          </div>
        )}
      </Card>
    </div>
  )
}
