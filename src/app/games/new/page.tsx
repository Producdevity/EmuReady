'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@orm'
import { api } from '@/lib/api'
import {
  LoadingSpinner,
  Button,
  RawgImageSelector,
  Autocomplete,
  Input,
} from '@/components/ui'
import { hasPermission } from '@/utils/permissions'
import getErrorMessage from '@/utils/getErrorMessage'
import type { AutocompleteOptionBase } from '@/components/ui/Autocomplete'

// Define the System type for Autocomplete
interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
}

function AddGamePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [systemId, setSystemId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const systemsQuery = api.systems.get.useQuery()
  const createGame = api.games.create.useMutation()

  useEffect(() => {
    if (!success && !error) return
    const timer = setTimeout(() => {
      setSuccess('')
      setError('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [success, error])

  if (status === 'loading') return <LoadingSpinner />

  if (!session || !hasPermission(session.user.role, Role.AUTHOR)) {
    return (
      <div className="p-8 text-center">
        You do not have permission to add games.
      </div>
    )
  }

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

      router.push(`/games/${result.id}`)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err, 'Failed to add game.'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Game
      </h1>
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
