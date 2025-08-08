'use client'

import { useUser } from '@clerk/nextjs'
import { Pencil, Image as ImageIcon, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button, Input, Badge } from '@/components/ui'
import { ImageSelectorSwitcher } from '@/components/ui/image-selectors'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import getImageUrl from '@/utils/getImageUrl'
import { hasPermission } from '@/utils/permissions'
import { sanitizeString } from '@/utils/validation'
import { ApprovalStatus, Role } from '@orm'

type ImageType = 'imageUrl' | 'boxartUrl' | 'bannerUrl'

const imageTypeToLabel: Record<ImageType, string> = {
  imageUrl: 'Cover Image',
  boxartUrl: 'Box Art',
  bannerUrl: 'Banner',
}

interface Props {
  gameData: RouterOutput['games']['byId']
}

export function GameEditForm(props: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(props.gameData.title)
  const [imageUrl, setImageUrl] = useState(props.gameData.imageUrl ?? '')
  const [boxartUrl, setBoxartUrl] = useState(props.gameData.boxartUrl ?? '')
  const [bannerUrl, setBannerUrl] = useState(props.gameData.bannerUrl ?? '')
  const [isErotic, setIsErotic] = useState(props.gameData.isErotic ?? false)
  const [activeImageTab, setActiveImageTab] = useState<ImageType>('imageUrl')
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const utils = api.useUtils()
  const { user } = useUser()

  // Get user data to determine permissions
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // Get the complete system data including tgdbPlatformId
  const systemQuery = api.systems.byId.useQuery(
    { id: props.gameData.systemId },
    { enabled: !!props.gameData.systemId },
  )

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
      toast.success('Game updated successfully')
      Promise.all([
        utils.games.byId.invalidate({ id: props.gameData.id }),
        utils.games.get.invalidate(),
      ]).catch((error) => {
        console.error('Error invalidating game cache:', error)
        toast.error('Failed to refresh game data. Please reload the page.')
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
      toast.success('Game updated successfully')
      Promise.all([
        utils.games.byId.invalidate({ id: props.gameData.id }),
        utils.games.get.invalidate(),
      ]).catch((error) => {
        console.error('Error invalidating game cache:', error)
        toast.error('Failed to refresh game data. Please reload the page.')
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
      boxartUrl: boxartUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      isErotic: isErotic,
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
    switch (activeImageTab) {
      case 'imageUrl':
        setImageUrl(url)
        break
      case 'boxartUrl':
        setBoxartUrl(url)
        break
      case 'bannerUrl':
        setBannerUrl(url)
        break
    }
    setShowImageSelector(false)
    setIsLoading(false)
    setError('')
  }

  const getCurrentImageUrl = () => {
    switch (activeImageTab) {
      case 'imageUrl':
        return imageUrl
      case 'boxartUrl':
        return boxartUrl
      case 'bannerUrl':
        return bannerUrl
      default:
        return ''
    }
  }

  const clearCurrentImage = () => {
    switch (activeImageTab) {
      case 'imageUrl':
        setImageUrl('')
        break
      case 'boxartUrl':
        setBoxartUrl('')
        break
      case 'bannerUrl':
        setBannerUrl('')
        break
    }
    // Reset loading state when clearing image
    setIsLoading(false)
    setError('')
  }

  // Reset loading state when switching tabs
  const handleTabSwitch = (type: ImageType) => {
    setActiveImageTab(type)
    setIsLoading(false)
    setError('')
  }

  // Reset loading state when closing image selector
  const handleCloseImageSelector = () => {
    setShowImageSelector(false)
    setIsLoading(false)
    setError('')
  }

  const imageTypes: ImageType[] = ['imageUrl', 'boxartUrl', 'bannerUrl']

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          // Reset loading state when opening modal
          setIsLoading(false)
          setError('')
          setOpen(true)
        }}
      >
        <Pencil className="h-4 w-4" />
        Edit Game
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-game-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg flex flex-col max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 id="edit-game-title" className="text-xl font-bold">
                Edit Game
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  System: {props.gameData.system?.name ?? 'Unknown System'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
                aria-label="Close edit game dialog"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow min-h-0">
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Image Management Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Game Images</h3>
                  </div>

                  {/* Image Type Tabs */}
                  <div className="flex gap-2">
                    {imageTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTabSwitch(type)}
                        className={cn(
                          'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          activeImageTab === type
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                        )}
                      >
                        {imageTypeToLabel[type]}
                      </button>
                    ))}
                  </div>

                  {/* Current Image Display */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium">
                        {imageTypeToLabel[activeImageTab]} URL
                      </label>
                      {getCurrentImageUrl() && (
                        <button
                          type="button"
                          onClick={clearCurrentImage}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>

                    <Input
                      value={getCurrentImageUrl()}
                      onChange={(ev) => {
                        switch (activeImageTab) {
                          case 'imageUrl':
                            setImageUrl(ev.target.value)
                            break
                          case 'boxartUrl':
                            setBoxartUrl(ev.target.value)
                            break
                          case 'bannerUrl':
                            setBannerUrl(ev.target.value)
                            break
                        }
                      }}
                      placeholder={`Enter ${imageTypeToLabel[activeImageTab]?.toLowerCase() ?? ''} URL`}
                    />

                    {/* Image Preview */}
                    {getCurrentImageUrl() && (
                      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(getCurrentImageUrl(), title) ?? ''}
                          alt={`${title} - ${imageTypeToLabel[activeImageTab]}`}
                          width={400}
                          height={200}
                          className="w-full h-48 object-contain"
                          unoptimized
                          onError={() =>
                            analytics.error.imageLoadError({
                              imageUrl: getCurrentImageUrl(),
                              id: props.gameData.id,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Image Selector Button */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowImageSelector(true)}
                        className="flex-1"
                      >
                        Search for {imageTypeToLabel[activeImageTab]}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Only show isErotic checkbox for admins */}
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isErotic}
                        onChange={(ev) => setIsErotic(ev.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium">Mark as 18+ Content (Erotic)</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      This game contains adult content and will be filtered based on user
                      preferences
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium">System</label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    {props.gameData.system?.name ?? 'Unknown System'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    System cannot be changed. Create a new game entry if needed.
                  </p>
                </div>

                {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} isLoading={isLoading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg flex flex-col max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold">Select {imageTypeToLabel[activeImageTab]}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseImageSelector}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow min-h-0">
              <ImageSelectorSwitcher
                gameTitle={title}
                systemName={props.gameData.system?.name}
                tgdbPlatformId={systemQuery.data?.tgdbPlatformId ?? undefined}
                selectedImageUrl={getCurrentImageUrl()}
                onImageSelect={handleImageSelect}
                onError={setError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
