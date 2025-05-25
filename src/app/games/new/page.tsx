'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@orm'
import { api } from '@/lib/api'
import { ImageUpload, LoadingSpinner } from '@/components/ui'
import { hasPermission } from '@/utils/permissions'

function AddGamePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [systemId, setSystemId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: systems, isLoading: systemsLoading } =
    api.systems.list.useQuery()
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
      setError(err instanceof Error ? err?.message : 'Failed to add game.')
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Game
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium">Game Title</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="Enter game title"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">System</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={systemId}
            onChange={(ev) => setSystemId(ev.target.value)}
            required
            disabled={systemsLoading}
          >
            <option value="">Select system...</option>
            {systems?.map((sys: { id: string; name: string }) => (
              <option key={sys.id} value={sys.id}>
                {sys.name}
              </option>
            ))}
          </select>
        </div>

        <ImageUpload
          onImageUploaded={setImageUrl}
          label="Game Cover Image (optional)"
          uploadPath="/api/upload/games"
        />

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
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 transform hover:scale-105"
          disabled={createGame.isPending}
        >
          {createGame.isPending ? 'Adding...' : 'Add Game'}
        </button>
      </form>
    </div>
  )
}

export default AddGamePage
