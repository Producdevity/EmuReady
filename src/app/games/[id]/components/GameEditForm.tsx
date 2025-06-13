'use client'

import { useUser } from '@clerk/nextjs'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import ImageSelectorSwitcher from '@/components/ui/image-selectors/ImageSelectorSwitcher'
import { api } from '@/lib/api'
import { hasPermission } from '@/utils/permissions'
import { sanitizeString } from '@/utils/validation'
import { ApprovalStatus, Role } from '@orm'

interface Props {
  gameData: {
    id: string
    title: string
    systemId: string
    imageUrl?: string | null
    status?: string
    submittedBy?: string | null
    system?: {
      id: string
      name: string
    }
  }
}

function GameEditForm(props: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(props.gameData.title)
  const [imageUrl, setImageUrl] = useState(props.gameData.imageUrl ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const utils = api.useUtils()
  const { user } = useUser()

  // Get user data to determine permissions
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // Determine if user is admin or owner of pending game
  const isAdmin = hasPermission(userQuery.data?.role, Role.ADMIN)
  const isOwnerOfPendingGame =
    userQuery.data &&
    props.gameData.submittedBy === userQuery.data.id &&
    props.gameData.status === ApprovalStatus.PENDING

  // Use appropriate mutation based on permissions
  const updateGameAdmin = api.games.update.useMutation({
    onSuccess: () => {
      setOpen(false)
      Promise.all([
        utils.games.byId.invalidate({ id: props.gameData.id }),
        utils.games.get.invalidate(),
      ]).catch((error) => {
        console.error('Error invalidating game cache:', error)
        router.refresh()
      })
    },
    onError: (err) => {
      setError(err.message)
      setIsLoading(false)
    },
  })

  const updateGameUser = api.games.updateOwnPendingGame.useMutation({
    onSuccess: () => {
      setOpen(false)
      Promise.all([
        utils.games.byId.invalidate({ id: props.gameData.id }),
        utils.games.get.invalidate(),
      ]).catch((error) => {
        console.error('Error invalidating game cache:', error)
        router.refresh()
      })
    },
    onError: (err) => {
      setError(err.message)
      setIsLoading(false)
    },
  })

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setIsLoading(true)
    setError('')

    // Sanitize inputs before submitting
    const sanitizedTitle = sanitizeString(title)

    if (!sanitizedTitle) {
      setError('Title cannot be empty')
      setIsLoading(false)
      return
    }

    const updateData = {
      id: props.gameData.id,
      title: sanitizedTitle,
      systemId: props.gameData.systemId,
      imageUrl: imageUrl || undefined,
    }

    // Use appropriate mutation based on user permissions
    if (isAdmin) {
      updateGameAdmin.mutate(updateData)
    } else if (isOwnerOfPendingGame) {
      updateGameUser.mutate(updateData)
    } else {
      setError('You do not have permission to edit this game')
      setIsLoading(false)
    }
  }

  const handleImageSelect = (url: string) => {
    setImageUrl(url)
  }

  return (
    <div className="relative">
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit Game
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg flex flex-col max-w-xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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

            <div className="p-6 overflow-y-auto flex-grow min-h-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(ev) => setTitle(ev.target.value)}
                    placeholder="Game title"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <ImageSelectorSwitcher
                    gameTitle={title}
                    systemName={props.gameData.system?.name}
                    selectedImageUrl={imageUrl}
                    onImageSelect={handleImageSelect}
                    onError={setError}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">System</label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    {props.gameData.system?.name ?? 'Unknown System'}
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
                  <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameEditForm
