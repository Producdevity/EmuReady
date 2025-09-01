import { useUser } from '@clerk/nextjs'
import { Edit3, Image as ImageIconLucide, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button, OptimizedImage, Modal } from '@/components/ui'
import { AdminImageSelectorSwitcher } from '@/components/ui/image-selectors'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getImageUrl from '@/utils/getImageUrl'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { hasPermission } from '@/utils/permissions'
import { ApprovalStatus, Role, type Game } from '@orm'

interface Props {
  game: Game & {
    system?: { name: string; tgdbPlatformId?: number | null }
  }
  width?: number
  height?: number
  className?: string
}

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 400

type ImageField = 'imageUrl' | 'boxartUrl' | 'bannerUrl'

export function GameBoxartImage(props: Props) {
  const { user } = useUser()
  const [activeImageType, setActiveImageType] = useState<ImageField>('imageUrl')
  const [showModal, setShowModal] = useState(false)

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  const updateGameMutation = api.games.update.useMutation({
    onSuccess: () => {
      toast.success('Game image updated successfully')
      setShowModal(false)
    },
    onError: (error) => {
      toast.error(`Failed to update game image: ${error.message}`)
    },
  })

  const isModerator = hasPermission(userQuery.data?.role, Role.MODERATOR)
  const isOwnerOfPendingGame =
    userQuery.data &&
    props.game.submittedBy === userQuery.data.id &&
    props.game.status === ApprovalStatus.PENDING

  const canEdit = isModerator || isOwnerOfPendingGame

  const handleImageSelect = (url: string, applyToAll = false) => {
    const updateData = {
      id: props.game.id,
      title: props.game.title,
      systemId: props.game.systemId,
      imageUrl: props.game.imageUrl || undefined,
      boxartUrl: props.game.boxartUrl || undefined,
      bannerUrl: props.game.bannerUrl || undefined,
    }

    if (applyToAll) {
      // Apply the same image to all three fields
      updateData.imageUrl = url || undefined
      updateData.boxartUrl = url || undefined
      updateData.bannerUrl = url || undefined
      toast.success('Applied image to all fields')
    } else {
      updateData[activeImageType] = url || undefined
    }

    updateGameMutation.mutate(updateData)
  }

  const handleImageTypeChange = (type: ImageField) => {
    setActiveImageType(type)
  }

  const getFieldValue = (field: ImageField) => {
    return props.game[field] || ''
  }

  const getFieldLabel = (field: ImageField) => {
    const labels = {
      imageUrl: 'Cover Image',
      boxartUrl: 'Boxart',
      bannerUrl: 'Banner',
    }
    return labels[field]
  }

  const getCurrentImageUrl = () => {
    return (
      getImageUrl(getFieldValue(activeImageType), props.game.title) || getGameImageUrl(props.game)
    )
  }

  const availableImageTypes: ImageField[] = ['imageUrl', 'boxartUrl', 'bannerUrl']

  return (
    <div className={cn('w-full md:w-1/4 flex-shrink-0', props.className)}>
      <div className="space-y-4">
        {/* Image Type Selector */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {availableImageTypes.map((type) => {
              const hasImage = !!getFieldValue(type)
              const isActive = type === activeImageType
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleImageTypeChange(type)}
                  className={cn(
                    'flex items-center gap-1 text-xs px-2 py-1 rounded transition-all',
                    isActive
                      ? hasImage
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-2 ring-gray-200 dark:ring-gray-700'
                      : hasImage
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                >
                  <ImageIconLucide className="h-3 w-3" />
                  {getFieldLabel(type)}
                  {!hasImage && <span className="text-[10px] opacity-60">(empty)</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Main Image Display */}
        <div className="relative group">
          <OptimizedImage
            src={getCurrentImageUrl()}
            alt={`${props.game.title} - ${getFieldLabel(activeImageType)}`}
            width={props.width ?? DEFAULT_WIDTH}
            height={props.height ?? DEFAULT_HEIGHT}
            className="w-full max-h-96 rounded-lg shadow-md"
            imageClassName="w-full max-h-96"
            objectFit="contain"
            fallbackSrc="/placeholder/game.svg"
            priority
            quality={75}
          />

          {canEdit && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                onClick={() => setShowModal(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit {getFieldLabel(activeImageType)}
              </Button>
            </div>
          )}
        </div>

        {/* Current Image Info */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getFieldLabel(activeImageType)}
          </p>
          {getFieldValue(activeImageType) ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {getFieldValue(activeImageType)}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              No {getFieldLabel(activeImageType).toLowerCase()} set
            </p>
          )}
        </div>
      </div>

      {/* Image Update Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Update ${getFieldLabel(activeImageType)}`}
        size="3xl"
      >
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const currentUrl = getFieldValue(activeImageType)
                  if (currentUrl) {
                    handleImageSelect(currentUrl, true)
                  } else {
                    toast.error('No image selected to apply to all fields')
                  }
                }}
                disabled={!getFieldValue(activeImageType)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Apply Current to All Images
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>This will set Cover, Boxart, and Banner to the same image</span>
              </div>
            </div>
          </div>

          {/* Image Type Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {availableImageTypes.map((type) => {
                const hasImage = !!getFieldValue(type)
                const isActive = type === activeImageType
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleImageTypeChange(type)}
                    className={cn(
                      'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all',
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300',
                    )}
                  >
                    <ImageIconLucide className="h-4 w-4" />
                    {getFieldLabel(type)}
                    {hasImage && (
                      <span className="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Current Image Preview */}
          {getFieldValue(activeImageType) && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current {getFieldLabel(activeImageType)}:
              </p>
              <div className="flex items-center gap-4">
                <OptimizedImage
                  src={getImageUrl(getFieldValue(activeImageType), props.game.title)}
                  alt="Current image"
                  width={100}
                  height={133}
                  className="w-24 h-32 object-cover rounded border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getFieldValue(activeImageType)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageSelect('', false)}
                    className="mt-2"
                  >
                    Remove {getFieldLabel(activeImageType)}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Image Selector */}
          <AdminImageSelectorSwitcher
            gameTitle={props.game.title}
            systemName={props.game.system?.name}
            tgdbPlatformId={props.game.system?.tgdbPlatformId || undefined}
            selectedImageUrl={getFieldValue(activeImageType)}
            onImageSelect={(url) => {
              handleImageSelect(url, false)
              setShowModal(false)
            }}
            onError={(error: string) => toast.error(error)}
            placeholder={`https://example.com/${activeImageType.replace('Url', '')}.jpg`}
          />

          {updateGameMutation.isPending && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Updating image...
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default GameBoxartImage
