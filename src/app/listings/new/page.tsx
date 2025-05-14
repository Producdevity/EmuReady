'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { api } from '@/lib/api'
import { Button, Input, Autocomplete } from '@/components/ui'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AddListingPage() {
  const { data: session, status } = useSession()
  const [gameId, setGameId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [emulatorId, setEmulatorId] = useState('')
  const [performanceId, setPerformanceId] = useState('')
  const [notes, setNotes] = useState('')
  const [listingId, setListingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Use a small initial limit for performance and enable lazy loading
  const {
    data: games,
    isLoading: gamesLoading,
    refetch: refetchGames,
  } = api.games.list.useQuery(
    {
      limit: 100,
      search: searchTerm || undefined,
    },
    {
      // Don't refetch automatically when window gets focus
      refetchOnWindowFocus: false,
      // Only fetch when we have a search term of sufficient length
      enabled: searchTerm.length >= 2 || searchTerm === '',
    },
  )

  const { data: devices, isLoading: devicesLoading } =
    api.devices.list.useQuery()
  const { data: emulators, isLoading: emulatorsLoading } =
    api.emulators.list.useQuery()
  const { data: performanceScales, isLoading: perfLoading } =
    api.listings.performanceScales.useQuery()
  const createListing = api.listings.create.useMutation()

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  // Simplified search handler for the Autocomplete component
  const handleGameSearch = async (query: string) => {
    setSearchTerm(query)
    setIsSearching(true)

    try {
      await refetchGames()

      // Simple debugging for search results
      console.log(
        `Search "${query}" found ${games?.games?.length ?? 0} results`,
      )
      if (games?.games?.length === 0 && query.length > 2) {
        console.log('No results found. Try refining your search.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>

  const userRole = session?.user?.role ?? 'USER'

  if (
    !session ||
    (userRole !== 'SUPER_ADMIN' &&
      userRole !== 'ADMIN' &&
      userRole !== 'AUTHOR')
  ) {
    return (
      <div className="p-8 text-center">
        You do not have permission to add listings.
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!gameId || !deviceId || !emulatorId || !performanceId) {
      setError('Please fill in all fields.')
      return
    }
    try {
      const listing = await createListing.mutateAsync({
        gameId,
        deviceId,
        emulatorId,
        performanceId: Number(performanceId),
        notes: notes || undefined,
      })
      setListingId(listing.id)
      setSuccess('Listing added!')
      setGameId('')
      setDeviceId('')
      setEmulatorId('')
      setPerformanceId('')
      setNotes('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to add listing.')
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-16 p-10 bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
        Add New Game Listing
      </h1>
      {success && listingId && (
        <div>
          <p className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
            {success}
          </p>
          <p className="mt-2 text-center text-sm text-blue-600 dark:text-blue-400">
            <Link href={`/listings/${listingId}`}>View Listing</Link>
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium">Game</label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Autocomplete
                options={(games?.games ?? []).map(
                  (game: { id: string; title: string }) => ({
                    value: game.id,
                    label: game.title,
                  }),
                )}
                value={gameId}
                onChange={setGameId}
                onSearch={handleGameSearch}
                placeholder="Search for a game..."
                leftIcon={<PuzzlePieceIcon className="w-5 h-5" />}
                loading={gamesLoading || isSearching}
                disabled={gamesLoading}
                minCharsToSearch={2}
                searchDebounce={400}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ml-2 flex-shrink-0 flex items-center gap-1 px-3 py-2"
              onClick={() => (window.location.href = '/games/new')}
              title="Add new game"
            >
              <PlusIcon className="w-4 h-4" />
              Add Game
            </Button>
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Device</label>
          <Input
            as="select"
            leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
            value={deviceId}
            onChange={(e) =>
              setDeviceId(
                (e as unknown as ChangeEvent<HTMLSelectElement>).target.value,
              )
            }
            required
            disabled={devicesLoading}
          >
            <option value="">Select device...</option>
            {devices?.map(
              (dev: { id: string; brand: string; modelName: string }) => (
                <option key={dev.id} value={dev.id}>
                  {dev.brand} {dev.modelName}
                </option>
              ),
            )}
          </Input>
        </div>
        <div>
          <label className="block mb-1 font-medium">Emulator</label>
          <Input
            as="select"
            leftIcon={<CpuChipIcon className="w-5 h-5" />}
            value={emulatorId}
            onChange={(e) =>
              setEmulatorId(
                (e as unknown as ChangeEvent<HTMLSelectElement>).target.value,
              )
            }
            required
            disabled={emulatorsLoading}
          >
            <option value="">Select emulator...</option>
            {emulators?.map((emu: { id: string; name: string }) => (
              <option key={emu.id} value={emu.id}>
                {emu.name}
              </option>
            ))}
          </Input>
        </div>
        <div>
          <label className="block mb-1 font-medium">Performance</label>
          <Input
            as="select"
            leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
            value={performanceId}
            onChange={(e) =>
              setPerformanceId(
                (e as unknown as ChangeEvent<HTMLSelectElement>).target.value,
              )
            }
            required
            disabled={perfLoading}
          >
            <option value="">Select performance...</option>
            {performanceScales?.map((perf: { id: number; label: string }) => (
              <option key={perf.id} value={perf.id}>
                {perf.label}
              </option>
            ))}
          </Input>
        </div>
        <div>
          <label className="block mb-1 font-medium">Notes (optional)</label>
          <Input
            as="textarea"
            leftIcon={<DocumentTextIcon className="w-5 h-5" />}
            value={notes}
            onChange={(e) =>
              setNotes(
                (e as unknown as ChangeEvent<HTMLTextAreaElement>).target.value,
              )
            }
            rows={2}
          />
        </div>
        {error && (
          <div className="text-red-500 fixed top-4 right-4 bg-white dark:bg-gray-800 border border-red-400 px-4 py-2 rounded shadow z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 fixed top-4 right-4 bg-white dark:bg-gray-800 border border-green-400 px-4 py-2 rounded shadow z-50">
            {success}
          </div>
        )}
        <Button
          type="submit"
          isLoading={createListing.isPending}
          isFullWidth
          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          {createListing.isPending ? 'Adding...' : 'Add Listing'}
        </Button>
      </form>
    </div>
  )
}
