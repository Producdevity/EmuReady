'use client'

import { useUser } from '@clerk/nextjs'
import { Search, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, type FormEvent } from 'react'
import {
  LoadingSpinner,
  Button,
  Input,
  ImageSelectorSwitcher,
  Autocomplete,
  type AutocompleteOptionBase,
} from '@/components/ui'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import NotSignedInMessage from './components/NotSignedInMessage'

export const dynamic = 'force-dynamic'

// Define the System type for Autocomplete
interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
  tgdbPlatformId: number | null
}

function AddGamePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [title, setTitle] = useState('')
  const [systemId, setSystemId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const systemsQuery = api.systems.get.useQuery()
  const createGame = api.games.create.useMutation()

  // Get user role from database using TRPC
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // Get the selected system's name based on systemId
  const selectedSystem = systemId
    ? systemsQuery.data?.find((system) => system.id === systemId)
    : null

  useEffect(() => {
    if (!success && !error) return
    const timer = setTimeout(() => {
      setSuccess('')
      setError('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [success, error])

  // Redirect non-authors users to TGDB search page
  useEffect(() => {
    if (
      isLoaded &&
      user &&
      userQuery.data &&
      !hasPermission(userQuery.data.role, Role.AUTHOR)
    ) {
      router.replace('/games/new/search')
    }
  }, [isLoaded, user, userQuery.data, router])

  if (!isLoaded || userQuery.isPending) return <LoadingSpinner />

  if (!user || !userQuery.data) return <NotSignedInMessage />

  const isAuthor = hasPermission(userQuery.data.role, Role.AUTHOR)

  // If not author, show loading while redirecting
  if (!isAuthor) return <LoadingSpinner />

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    if (!title || !systemId) {
      return setError('Please fill in all required fields.')
    }

    try {
      const result = await createGame.mutateAsync({
        title,
        systemId,
        imageUrl: imageUrl || undefined,
      })

      setSuccess('Game added successfully!')
      const timeoutId = window.setTimeout(
        () => router.push(`/games/${result.id}`),
        1500,
      )
      return () => window.clearTimeout(timeoutId)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err, 'Failed to add game.'))
    }
  }

  return (
    <div className="w-full md:w-3xl mx-auto my-10 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Game (Author and Admin Only)
      </h1>

      {/* Method Selection */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Choose Method:
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Manual Entry
              </span>
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                CURRENT
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Type the game title manually. Good for quick entry or games not in
              TGDB.
            </p>
          </div>

          <div className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Search TGDB
              </span>
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                RECOMMENDED
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Search TheGamesDB for accurate game names and images. Prevents
              duplicates and typos.
            </p>
            <Link href="/games/new/search">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-green-700 border-green-300 hover:bg-green-100"
              >
                Try Search Method
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Author Note:</strong> Manual entry is restricted to authors
          and administrators to maintain data quality. Regular users are
          automatically redirected to the TGDB search method.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
            Game Title
          </label>
          <Input
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="Enter game title"
            required
          />
        </div>

        <div>
          <Autocomplete<SystemOption>
            label="System"
            placeholder="Search for a system..."
            value={systemId}
            onChange={(value) => setSystemId(value ?? '')}
            items={systemsQuery.data ?? []}
            optionToValue={(option) => option.id}
            optionToLabel={(option) => option.name}
            filterKeys={['name']}
            minCharsToTrigger={0}
            disabled={systemsQuery.isPending}
            className="w-full"
          />
        </div>

        <ImageSelectorSwitcher
          gameTitle={title}
          systemName={selectedSystem?.name}
          tgdbPlatformId={selectedSystem?.tgdbPlatformId ?? undefined}
          selectedImageUrl={imageUrl}
          onImageSelect={setImageUrl}
          onError={setError}
        />

        {error && (
          <div className="text-red-500  bg-white dark:bg-gray-800 border border-red-400 px-4 py-2 rounded shadow z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600  bg-white dark:bg-gray-800 border border-green-400 px-4 py-2 rounded shadow z-50">
            {success}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isFullWidth
          disabled={createGame.isPending}
          isLoading={createGame.isPending}
        >
          Add Game
        </Button>
      </form>
    </div>
  )
}

export default AddGamePage
