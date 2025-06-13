import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit3, X, Image as ImageIconLucide } from 'lucide-react'
import { useState } from 'react'
import { Button, OptimizedImage } from '@/components/ui'
import AdminImageSelectorSwitcher from '@/components/ui/image-selectors/AdminImageSelectorSwitcher'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
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

function GameBoxartImage(props: Props) {
  const { user } = useUser()
  const [activeImageType, setActiveImageType] = useState<ImageField>('imageUrl')
  const [showImageSelector, setShowImageSelector] = useState(false)

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  const updateGameMutation = api.games.update.useMutation({
    onSuccess: () => {
      toast.success('Game image updated successfully')
      setShowImageSelector(false)
    },
    onError: (error) => {
      toast.error(`Failed to update game image: ${error.message}`)
    },
  })

  const isAdmin = hasPermission(userQuery.data?.role, Role.ADMIN)
  const isOwnerOfPendingGame =
    userQuery.data &&
    props.game.submittedBy === userQuery.data.id &&
    props.game.status === ApprovalStatus.PENDING

  const canEdit = isAdmin || isOwnerOfPendingGame

  const handleImageSelect = (url: string) => {
    updateGameMutation.mutate({
      id: props.game.id,
      title: props.game.title,
      systemId: props.game.systemId,
      [activeImageType]: url || null,
    })
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
    return getFieldValue(activeImageType) || getGameImageUrl(props.game)
  }

  const availableImageTypes: ImageField[] = [
    'imageUrl',
    'boxartUrl',
    'bannerUrl',
  ]

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
                  {!hasImage && (
                    <span className="text-[10px] opacity-60">(empty)</span>
                  )}
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
          />

          {canEdit && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                onClick={() => setShowImageSelector(!showImageSelector)}
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

      {/* Collapsible Image Selector */}
      <AnimatePresence>
        {showImageSelector && canEdit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Update {getFieldLabel(activeImageType)}
                </h4>
                <Button
                  onClick={() => setShowImageSelector(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <AdminImageSelectorSwitcher
                gameTitle={props.game.title}
                systemName={props.game.system?.name}
                tgdbPlatformId={props.game.system?.tgdbPlatformId || undefined}
                selectedImageUrl={getFieldValue(activeImageType)}
                onImageSelect={handleImageSelect}
                onError={(error: string) => toast.error(error)}
                placeholder={`https://example.com/${activeImageType.replace('Url', '')}.jpg`}
              />

              {updateGameMutation.isPending && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Updating image...
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GameBoxartImage
