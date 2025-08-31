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
      badgeColor: 'bg-gradient-to-r from-purple-600 to-blue-600',
      description:
        'Most comprehensive database with accurate metadata, multiple images, and NSFW detection',
      borderColor: 'border-purple-500/50',
      bgColor:
        'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20',
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
      borderColor: 'border-green-500/50',
      bgColor:
        'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
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
      borderColor: 'border-blue-500/50',
      bgColor:
        'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      isActive: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Add New Game</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
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
                className={`relative group transition-all duration-300 ${
                  method.isActive ? 'scale-105' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`
                    h-full p-6 rounded-2xl border-2 transition-all duration-300
                    ${method.bgColor} ${method.borderColor}
                    ${
                      method.isActive
                        ? 'shadow-xl border-opacity-100'
                        : 'shadow-lg hover:shadow-xl border-opacity-30 hover:border-opacity-50'
                    }
                  `}
                >
                  {/* Badge */}
                  <div className="absolute -top-3 right-6">
                    <span
                      className={`
                      px-3 py-1 text-xs font-bold text-white rounded-full
                      ${method.badgeColor}
                    `}
                    >
                      {method.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-4
                    bg-white/50 dark:bg-black/20 backdrop-blur-sm
                  `}
                  >
                    <Icon className={`h-6 w-6 ${method.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 min-h-[3rem]">
                    {method.description}
                  </p>

                  {/* Action */}
                  {method.href ? (
                    <Link href={method.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-white dark:group-hover:bg-gray-800"
                      >
                        <span>Use This Method</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                      Currently Selected
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual Entry Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manual Entry Form
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
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

            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <input
                type="checkbox"
                id="isErotic-new"
                checked={isErotic}
                onChange={(e) => setIsErotic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="isErotic-new"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
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
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
