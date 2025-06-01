'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, LoadingSpinner, OptimizedImage, Modal, Input } from '@/components/ui'
import { type GameImageOption } from '@/types/rawg'
import getImageUrl from '@/app/games/utils/getImageUrl'
import { getImageDisplayName } from '@/lib/rawg-utils'

interface RawgImageSelectorProps {
  gameTitle?: string
  selectedImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

function RawgImageSelector(props: RawgImageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(props.gameTitle ?? '')
  const [selectedImage, setSelectedImage] = useState<GameImageOption | null>(
    null,
  )
  const [allImages, setAllImages] = useState<GameImageOption[]>([])
  const [previewImage, setPreviewImage] = useState<GameImageOption | null>(null)

  const searchQuery = api.rawg.searchGameImages.useQuery(
    { query: searchTerm },
    {
      enabled: searchTerm.length >= 2,
      staleTime: 5 * 60 * 1000,
    },
  )

  // Use refs to avoid dependency issues with functions
  const onImageSelectRef = useRef(props.onImageSelect)
  const onErrorRef = useRef(props.onError)
  const prevGameTitleRef = useRef(props.gameTitle)

  // Update refs when props change
  useEffect(() => {
    onImageSelectRef.current = props.onImageSelect
  }, [props.onImageSelect])

  useEffect(() => {
    onErrorRef.current = props.onError
  }, [props.onError])

  useEffect(() => {
    if (props.gameTitle && props.gameTitle !== prevGameTitleRef.current) {
      setSearchTerm(props.gameTitle)
      prevGameTitleRef.current = props.gameTitle
    }
  }, [props.gameTitle])

  useEffect(() => {
    if (searchQuery.data) {
      const images: GameImageOption[] = []

      Object.entries(searchQuery.data).forEach(([, gameImages]) => {
        images.push(...gameImages)
      })

      setAllImages(images)

      if (images.length > 0 && !selectedImage) {
        const firstImage = images[0]
        setSelectedImage(firstImage)
        onImageSelectRef.current(firstImage.url)
      }
    }
  }, [searchQuery.data, selectedImage])

  const handleSearch = () => {
    if (searchTerm.trim().length >= 2) {
      searchQuery.refetch()
    }
  }

  const handleImageSelect = (image: GameImageOption) => {
    setSelectedImage(image)
    onImageSelectRef.current(image.url)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handlePreviewImage = (e: React.MouseEvent, image: GameImageOption) => {
    e.stopPropagation() // Prevent selecting the image when clicking preview
    setPreviewImage(image)
  }

  const closePreview = () => {
    setPreviewImage(null)
  }

  useEffect(() => {
    if (searchQuery.error) {
      onErrorRef.current?.(
        searchQuery.error.message || 'Failed to search for images',
      )
    }
  }, [searchQuery.error])

  return (
    <div className={props.className}>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
        Select Game Cover Image from RAWG.io
      </label>

      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            leftIcon={<Search className="h-5 w-5" />}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter game title..."
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={searchTerm.length < 2 || searchQuery.isFetching}
          className="px-6 h-full"
        >
          Search
        </Button>
      </div>

      {searchQuery.isFetching && (
        <div className="flex justify-center py-8">
          <LoadingSpinner text="Searching for images..." />
        </div>
      )}

      {searchQuery.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">
            Error searching for images: {searchQuery.error.message}
          </p>
        </div>
      )}

      {allImages.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {allImages.length} images. Click to select:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {allImages.map((image) => (
              <div
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-xl group ${
                  selectedImage?.id === image.id
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                  <OptimizedImage
                    src={getImageUrl(image.url, image.gameName)}
                    alt={getImageDisplayName(image)}
                    width={200}
                    height={200}
                    objectFit="cover"
                    className="w-full h-full"
                    fallbackSrc="/placeholder/game.svg"
                  />

                  {/* Preview Button - Shows on hover */}
                  <button
                    onClick={(e) => handlePreviewImage(e, image)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Preview image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2">
                    <div className="flex items-center gap-2">
                      {image.type === 'background' ? (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                          Cover
                        </span>
                      ) : (
                        <span className="text-xs bg-green-600 px-2 py-1 rounded">
                          Screenshot
                        </span>
                      )}
                      <span
                        className="text-xs truncate"
                        title={image.gameName} // Tooltip for full game name
                      >
                        {image.gameName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchTerm.length >= 2 &&
        !searchQuery.isFetching &&
        allImages.length === 0 &&
        searchQuery.data && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No images found for &ldquo;{searchTerm}&rdquo;. Try a different
              search term.
            </p>
          </div>
        )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={closePreview}
          title={previewImage.gameName}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <OptimizedImage
                src={getImageUrl(previewImage.url, previewImage.gameName)}
                alt={getImageDisplayName(previewImage)}
                width={600}
                height={400}
                objectFit="contain"
                className="w-full h-auto max-h-[70vh]"
                fallbackSrc="/placeholder/game.svg"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {previewImage.type === 'background' ? (
                  <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded">
                    Cover Image
                  </span>
                ) : (
                  <span className="text-sm bg-green-600 text-white px-3 py-1 rounded">
                    Screenshot
                  </span>
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {previewImage.width && previewImage.height
                    ? `${previewImage.width} × ${previewImage.height}`
                    : 'Resolution unknown'
                  }
                </span>
              </div>
              <Button
                onClick={() => {
                  handleImageSelect(previewImage)
                  closePreview()
                }}
                variant="primary"
                size="sm"
              >
                Select This Image
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RawgImageSelector
