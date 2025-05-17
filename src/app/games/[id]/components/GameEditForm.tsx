'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button, Input } from '@/components/ui'
import { PencilIcon } from '@heroicons/react/24/outline'
import { sanitizeString } from '@/utils/validation'

interface Props {
  gameData: {
    id: string
    title: string
    systemId: string
    imageUrl?: string | null
    system?: {
      id: string
      name: string
    }
  }
}

export default function GameEditForm({ gameData }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(gameData.title)
  const [imageUrl, setImageUrl] = useState(gameData.imageUrl ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const updateGame = api.games.update.useMutation({
    onSuccess: () => {
      setOpen(false)
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
      setIsLoading(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Sanitize inputs before submitting
    const sanitizedTitle = sanitizeString(title)
    const sanitizedImageUrl = imageUrl.trim()

    // Add basic URL validation for image
    if (sanitizedImageUrl && !sanitizedImageUrl.match(/^https?:\/\/.+/i)) {
      setError('Image URL must start with http:// or https://')
      setIsLoading(false)
      return
    }

    if (!sanitizedTitle) {
      setError('Title cannot be empty')
      setIsLoading(false)
      return
    }

    updateGame.mutate({
      id: gameData.id,
      title: sanitizedTitle,
      systemId: gameData.systemId,
      imageUrl: sanitizedImageUrl || undefined,
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
  }

  return (
    <div className="relative">
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <PencilIcon className="h-4 w-4" />
        Edit Game
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Game</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Game title"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="block text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">System</label>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                  {gameData.system?.name ?? 'Unknown System'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  System cannot be changed. Create a new game entry if needed.
                </p>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
