import {
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Database,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Eye,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type ProcessingAction } from '@/app/admin/games/approvals/page'
import { Modal, Button, ApprovalStatusBadge } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import { type Nullable } from '@/types/utils'
import { formatDate, formatTimeAgo } from '@/utils/date'
import getImageUrl from '@/utils/getImageUrl'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import ImagePreviewModal from './ImagePreviewModal'

type Game = RouterOutput['games']['getPendingGames']['games'][number]
type ImageTabType = 'boxart' | 'banner' | 'main'

function getInitialImageTab(game: Game | null): ImageTabType {
  if (game?.boxartUrl) return 'boxart'
  if (game?.bannerUrl) return 'banner'
  return 'main'
}

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedGame: Game | null
  onShowConfirmation: (gameId: string, action: ProcessingAction) => void
  isProcessing: boolean
  processingAction: Nullable<ProcessingAction>
}

function GameDetailsModal(props: Props) {
  const router = useRouter()
  const [activeImageTab, setActiveImageTab] = useState<ImageTabType>(
    getInitialImageTab(props.selectedGame),
  )
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageType, setPreviewImageType] = useState<
    'boxart' | 'banner' | 'imageUrl'
  >('boxart')

  // Get current user to check permissions
  const currentUserQuery = api.users.me.useQuery()
  const isSuperAdmin = currentUserQuery.data?.role
    ? hasPermission(currentUserQuery.data.role, Role.SUPER_ADMIN)
    : false

  if (!props.selectedGame) return null

  const handleImageError = (imageType: string) => {
    setImageError((prev) => ({ ...prev, [imageType]: true }))
  }

  const getDisplayImage = () => {
    switch (activeImageTab) {
      case 'boxart':
        return props.selectedGame?.boxartUrl && !imageError.boxart
          ? props.selectedGame?.boxartUrl
          : null
      case 'banner':
        return props.selectedGame?.bannerUrl && !imageError.banner
          ? props.selectedGame?.bannerUrl
          : null
      case 'main':
        return props.selectedGame?.imageUrl && !imageError.main
          ? props.selectedGame?.imageUrl
          : null
      default:
        return null
    }
  }

  const hasAnyImage = Boolean(
    (props.selectedGame.boxartUrl && !imageError.boxart) ??
      (props.selectedGame.bannerUrl && !imageError.banner) ??
      (props.selectedGame.imageUrl && !imageError.main),
  )

  const hasOnlyOneImage =
    [
      props.selectedGame.boxartUrl && !imageError.boxart,
      props.selectedGame.bannerUrl && !imageError.banner,
      props.selectedGame.imageUrl && !imageError.main,
    ].filter(Boolean).length === 1

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`Copied ${label} to clipboard (${text})`))
      .catch((error) => {
        console.error('Copy to clipboard failed:', error)
        toast.error('Failed to copy to clipboard. Please try again.')
      })
  }

  const navigateToUserModal = (userId: string) => {
    // Close current modal first
    props.onClose()
    // Navigate to admin users page with user modal open
    router.push(`/admin/users?userId=${userId}`)
  }

  const handleImageClick = (imageType: 'boxart' | 'banner' | 'imageUrl') => {
    setPreviewImageType(imageType)
    setIsImagePreviewOpen(true)
  }

  const displayImage = getImageUrl(getDisplayImage(), props.selectedGame.title)

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Game Details"
      className="max-w-4xl"
    >
      <div className="relative">
        {/* Header with Hero Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-t-lg overflow-hidden">
          {hasAnyImage && (
            <div className="absolute inset-0 bg-black/20">
              <Image
                src={displayImage ?? ''}
                alt={props.selectedGame.title}
                fill
                className="object-cover opacity-30"
                onError={() => handleImageError(activeImageTab)}
                unoptimized
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Game Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <ApprovalStatusBadge status={props.selectedGame.status} />
              {props.selectedGame.tgdbGameId && (
                <div className="flex items-center gap-1 px-2 py-1 bg-black/30 rounded-full text-xs text-white">
                  <Database className="w-3 h-3" />
                  TGDB ID: {props.selectedGame.tgdbGameId}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
              {props.selectedGame.title}
            </h1>
            <p className="text-blue-100 font-medium drop-shadow">
              {props.selectedGame.system.name}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          {hasAnyImage && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                {hasOnlyOneImage ? 'Game Image' : 'Game Images'}
              </h3>

              {/* Image Tabs */}
              {hasOnlyOneImage && (
                <div className="flex gap-2">
                  {props.selectedGame.boxartUrl && !imageError.boxart && (
                    <button
                      onClick={() => setActiveImageTab('boxart')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                        activeImageTab === 'boxart'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      Box Art
                    </button>
                  )}
                  {props.selectedGame.bannerUrl && !imageError.banner && (
                    <button
                      onClick={() => setActiveImageTab('banner')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                        activeImageTab === 'banner'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      Banner
                    </button>
                  )}
                  {props.selectedGame.imageUrl && !imageError.main && (
                    <button
                      onClick={() => setActiveImageTab('main')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                        activeImageTab === 'main'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      Main Image
                    </button>
                  )}
                </div>
              )}

              {/* Image Display */}
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
                {displayImage && (
                  <button
                    onClick={() =>
                      handleImageClick(
                        activeImageTab === 'main' ? 'imageUrl' : activeImageTab,
                      )
                    }
                    className="w-full block"
                  >
                    <Image
                      src={displayImage ?? ''}
                      alt={`${props.selectedGame.title} - ${activeImageTab}`}
                      width={800}
                      height={256}
                      className="w-full h-64 object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onError={() => handleImageError(activeImageTab)}
                      unoptimized
                    />
                  </button>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() =>
                      window.open(getDisplayImage() ?? '', '_blank')
                    }
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors duration-200"
                    title="View full size"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Submission Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Submission Details
              </h3>

              <div className="space-y-3">
                {/* Submitter */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {props.selectedGame.submitter?.profileImage && (
                    <Image
                      src={props.selectedGame.submitter.profileImage}
                      alt={props.selectedGame.submitter.name ?? 'Submitter'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {props.selectedGame.submitter?.id && isSuperAdmin ? (
                      <button
                        onClick={() => {
                          if (!props.selectedGame?.submitter?.id) return
                          navigateToUserModal(props.selectedGame?.submitter?.id)
                        }}
                        className="text-left w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                        title="View user details"
                      >
                        {props.selectedGame.submitter.name ?? 'Unknown User'}
                      </button>
                    ) : props.selectedGame.submitter?.id && !isSuperAdmin ? (
                      <Link
                        href={`/users/${props.selectedGame.submitter.id}`}
                        className="text-left w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                        title="View public profile"
                      >
                        {props.selectedGame.submitter.name ?? 'Unknown User'}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {props.selectedGame.submitter?.name ?? 'Unknown User'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {props.selectedGame.submitter?.email}
                    </p>
                  </div>
                  {props.selectedGame.submitter?.id && (
                    <button
                      onClick={() => {
                        if (!props.selectedGame?.submitter?.id) return
                        copyToClipboard(
                          props.selectedGame.submitter.id,
                          'Submitter ID',
                        )
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      title="Copy User ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Submission Date */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Submitted
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(props.selectedGame.submittedAt!)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(props.selectedGame.submittedAt!)}
                  </p>
                </div>
              </div>
            </div>

            {/* System & Technical Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Technical Details
              </h3>

              <div className="space-y-3">
                {/* System Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {props.selectedGame.system.name}
                  </p>
                  {props.selectedGame.system.key && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      <span className="font-bold">Key: </span>
                      {props.selectedGame.system.key}
                    </p>
                  )}
                  {props.selectedGame.system.tgdbPlatformId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="font-bold">TGDB Platform ID: </span>
                      {props.selectedGame.system.tgdbPlatformId}
                    </p>
                  )}
                </div>

                {/* Game IDs */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Identifiers
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Game ID:
                      </span>
                      <div className="flex items-center gap-1 ml-4">
                        <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {props.selectedGame.id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() => {
                            if (!props.selectedGame?.id) return
                            copyToClipboard(props.selectedGame.id, 'Game ID')
                          }}
                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copy Game ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {props.selectedGame.tgdbGameId && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          TGDB ID:
                        </span>
                        <div className="flex items-center gap-1 ml-4">
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                            {props.selectedGame.tgdbGameId}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Link
              href={`/games/${props.selectedGame.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              View Public Page
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={props.onClose}
              className="min-w-[100px]"
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!props.selectedGame?.id) return
                props.onShowConfirmation(props.selectedGame.id, 'reject')
              }}
              disabled={props.isProcessing}
              isLoading={props.processingAction === 'reject'}
              className="min-w-[100px] transition-all duration-200 hover:scale-105"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!props.selectedGame?.id) return
                props.onShowConfirmation(props.selectedGame.id, 'approve')
              }}
              disabled={props.isProcessing}
              isLoading={props.processingAction === 'approve'}
              className="min-w-[100px] transition-all duration-200 hover:scale-105"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        game={props.selectedGame}
        initialImageType={previewImageType}
      />
    </Modal>
  )
}

export default GameDetailsModal
