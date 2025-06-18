'use client'

import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import getImageUrl from '@/utils/getImageUrl'

type ImageType = 'boxart' | 'banner' | 'imageUrl'

interface GameWithImages {
  id: string
  title: string
  boxartUrl?: string | null
  bannerUrl?: string | null
  imageUrl?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  game: GameWithImages | null
  initialImageType?: ImageType
}

function ImagePreviewModal(props: Props) {
  const [activeTab, setActiveTab] = useState<ImageType>(
    props.initialImageType ?? 'boxart',
  )
  const [failedImages, setFailedImages] = useState<Set<ImageType>>(new Set())

  if (!props.game) return null

  const tabLabelMap: Record<ImageType, string> = {
    boxart: 'Box Art',
    banner: 'Banner',
    imageUrl: 'Main Image',
  }

  const availableImageTypes: ImageType[] = [
    ...(props.game.boxartUrl ? ['boxart' as const] : []),
    ...(props.game.bannerUrl ? ['banner' as const] : []),
    ...(props.game.imageUrl ? ['imageUrl' as const] : []),
  ]

  const getImageUrlByType = (type: ImageType): string | null => {
    switch (type) {
      case 'boxart':
        return props.game?.boxartUrl ?? null
      case 'banner':
        return props.game?.bannerUrl ?? null
      case 'imageUrl':
        return props.game?.imageUrl ?? null
      default:
        return null
    }
  }

  const currentImageUrl = getImageUrlByType(activeTab)
  const displayImageUrl = currentImageUrl ? getImageUrl(currentImageUrl) : null

  const handleImageError = (type: ImageType) => {
    setFailedImages((prev) => new Set([...prev, type]))
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={`${props.game.title} - Images`}
      size="3xl"
    >
      <div className="space-y-4">
        {/* Image Type Tabs */}
        {availableImageTypes.length > 1 && (
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
            {availableImageTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  activeTab === type
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
              >
                {tabLabelMap[type]}
              </button>
            ))}
          </div>
        )}

        {/* Image Display */}
        <div className="relative">
          {currentImageUrl && !failedImages.has(activeTab) ? (
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
              <div className="relative w-full h-96 flex items-center justify-center">
                <Image
                  src={displayImageUrl ?? ''}
                  alt={`${props.game.title} - ${tabLabelMap[activeTab]}`}
                  fill
                  className="object-contain"
                  onError={() => handleImageError(activeTab)}
                  unoptimized
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => window.open(currentImageUrl, '_blank')}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors duration-200"
                  title="View full size"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No {tabLabelMap[activeTab].toLowerCase()} available
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ImagePreviewModal
