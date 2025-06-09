'use client'

import { hasPermission } from '@/utils/permissions'
import { useUser } from '@clerk/nextjs'
import { Role } from '@orm'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  LoadingSpinner,
  Button,
  RawgImageSelector,
  Autocomplete,
  Input,
} from '@/components/ui'
import getErrorMessage from '@/utils/getErrorMessage'
import type { AutocompleteOptionBase } from '@/components/ui/Autocomplete'
import NotSignedInMessage from './components/NotSignedInMessage'

// Define the System type for Autocomplete
interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
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
  const userQuery = api.users.getProfile.useQuery(undefined, {
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

  if (!isLoaded || userQuery.isLoading) return <LoadingSpinner />

  if (!user || !userQuery.data) return <NotSignedInMessage />

  const isAdmin = hasPermission(userQuery.data.role, Role.ADMIN)

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

      if (isAdmin) {
        setSuccess('Game added successfully!')
        setTimeout(() => router.push(`/games/${result.id}`), 1500)
      } else {
        setSuccess(
          'Game submitted for approval! You can now create listings for this game while it awaits admin approval.',
        )
        setTimeout(() => router.push(`/games/${result.id}`), 3000)
      }
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err, 'Failed to add game.'))
    }
  }

  return (
    <div className="w-full md:w-3xl mx-auto my-10 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Game
      </h1>

      {!isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Games submitted by users require admin
            approval before becoming visible to other users. You can create
            listings for your submitted games immediately while they await
            approval.
          </p>
        </div>
      )}

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
            disabled={systemsQuery.isLoading}
            className="w-full"
          />
        </div>

        <RawgImageSelector
          gameTitle={title}
          systemName={selectedSystem?.name}
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
