'use client'

import { useUser } from '@clerk/nextjs'
import { Database, Edit, Sparkles, ArrowRight } from 'lucide-react'
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
import { cn } from '@/lib/utils'
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
  const [isErotic, setIsErotic] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const utils = api.useUtils()
  const systemsQuery = api.systems.get.useQuery()
  const createGame = api.games.create.useMutation()

  // Get user role from database using TRPC
  const userQuery = api.users.me.useQuery(undefined, { enabled: !!user })

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

  // Redirect non-authors users to IGDB search page
  useEffect(() => {
    if (isLoaded && user && userQuery.data && !hasPermission(userQuery.data.role, Role.AUTHOR)) {
      router.replace('/games/new/search/v2')
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
    if (!title || !systemId) return setError('Please fill in all required fields.')

    try {
      const result = await createGame.mutateAsync({
        title,
        systemId,
        imageUrl: imageUrl || undefined,
        isErotic,
      })

      // Invalidate games queries to refresh the list
      await utils.games.get.invalidate()
      await utils.games.checkExistingByTgdbIds.invalidate()
      await utils.games.checkExistingByNamesAndSystems.invalidate()

      setSuccess('Game added successfully!')
      const timeoutId = window.setTimeout(() => router.push(`/games/${result.id}`), 1500)
      return () => window.clearTimeout(timeoutId)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err, 'Failed to add game.'))
    }
  }

  const searchMethods = [
    {
      id: 'igdb',
      icon: Sparkles,
      title: 'IGDB Search',
      badge: 'RECOMMENDED',
      badgeColor: 'bg-purple-600',
      description:
        'Most comprehensive database with accurate metadata, multiple images, and NSFW detection',
      iconColor: 'text-purple-600 dark:text-purple-400',
      href: '/games/new/search/v2',
    },
    {
      id: 'tgdb',
      icon: Database,
      title: 'TheGamesDB',
      badge: 'CLASSIC',
      badgeColor: 'bg-green-600',
      description: 'Community-sourced database with classic game coverage and box art',
      iconColor: 'text-green-600 dark:text-green-400',
      href: '/games/new/search',
    },
    {
      id: 'manual',
      icon: Edit,
      title: 'Manual Entry',
      badge: 'CURRENT',
      badgeColor: 'bg-blue-600',
      description: 'Type the game title manually. Quick entry for games not in databases',
      iconColor: 'text-blue-600 dark:text-blue-400',
      isActive: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Add New Game</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose how you want to add your game to the database
          </p>
        </div>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {searchMethods.map((method) => {
            const Icon = method.icon
            return (
              <div
                key={method.id}
                className={cn(
                  'relative',
                  method.isActive ? '' : 'transition-transform duration-300 hover:-translate-y-1',
                )}
              >
                <div
                  className={cn(
                    'relative h-full flex flex-col p-6 rounded-xl border transition-all duration-300',
                    'bg-white dark:bg-slate-800',
                    method.isActive
                      ? 'border-2 border-blue-500 dark:border-blue-400 shadow-xl'
                      : 'border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600',
                  )}
                >
                  {/* Badge */}
                  <div className="absolute -top-3 right-4">
                    <span
                      className={cn(
                        'px-3 py-1 text-xs font-bold text-white rounded-full',
                        method.badgeColor,
                      )}
                    >
                      {method.badge}
                    </span>
                  </div>

                  {/* Icon and Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-slate-900">
                      <Icon className={cn('h-6 w-6', method.iconColor)} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {method.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
                    {method.description}
                  </p>

                  {/* Action */}
                  {method.href ? (
                    <Link href={method.href} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <span>Use This Method</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Currently Selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual Entry Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manual Entry Form
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Fill in the details below to add a new game manually
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Game Title
              </label>
              <Input
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                placeholder="Enter game title"
                required
                className="w-full"
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

            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
              <input
                type="checkbox"
                id="isErotic-new"
                checked={isErotic}
                onChange={(e) => setIsErotic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="isErotic-new"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Mark as Adult Content (18+)
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isFullWidth
              disabled={createGame.isPending}
              isLoading={createGame.isPending}
              className="mt-6"
            >
              Add Game to Database
            </Button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Manual entry is restricted to authors and administrators to
            maintain data quality. Regular users are automatically redirected to the IGDB search for
            better accuracy and metadata.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AddGamePage
