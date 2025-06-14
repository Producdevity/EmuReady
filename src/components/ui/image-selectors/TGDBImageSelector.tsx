'use client'

import { Search, Eye, Camera, LinkIcon } from 'lucide-react'
import { useState, useEffect, type KeyboardEvent, type MouseEvent } from 'react'
import {
  Button,
  LoadingSpinner,
  OptimizedImage,
  Modal,
  Input,
  Toggle,
} from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { getImageDisplayName, getImageTypeDisplayName } from '@/lib/tgdb-utils'
import { cn } from '@/lib/utils'
import { type GameImageOption, type GameImageType } from '@/types/tgdb'

function getImageTypeClassName(imageType: GameImageType) {
  return imageType === 'boxart'
    ? 'bg-blue-600'
    : imageType === 'fanart'
      ? 'bg-purple-600'
      : imageType === 'screenshot'
        ? 'bg-green-600'
        : imageType === 'banner'
          ? 'bg-orange-600'
          : imageType === 'clearlogo'
            ? 'bg-pink-600'
            : 'bg-gray-600'
}

interface Props {
  gameTitle?: string
  tgdbPlatformId?: number
  selectedImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

function TGDBImageSelector(props: Props) {
  const [searchTerm, setSearchTerm] = useState(props.gameTitle ?? '')
  const [selectedImage, setSelectedImage] = useState<GameImageOption | null>(
    null,
  )
  const [allImages, setAllImages] = useState<GameImageOption[]>([])
  const [previewImage, setPreviewImage] = useState<GameImageOption | null>(null)
  const [includeAllTypes, setIncludeAllTypes] = useState(false)
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  // Debounced search to avoid API spam
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  // Extract callbacks to avoid props dependency issues
  const onImageSelect = props.onImageSelect
  const onError = props.onError

  const getSearchQuery = () =>
    props.tgdbPlatformId
      ? { query: debouncedSearchTerm, platformId: props.tgdbPlatformId }
      : { query: debouncedSearchTerm }

  const searchQuery = api.tgdb.searchGameImages.useQuery(getSearchQuery(), {
    enabled: !useCustomUrl && debouncedSearchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  })

  // Update search term when gameTitle prop changes
  useEffect(() => {
    if (props.gameTitle && props.gameTitle !== searchTerm) {
      setSearchTerm(props.gameTitle)
    }
  }, [props.gameTitle, searchTerm])

  // Handle search results and auto-select first image
  useEffect(() => {
    if (searchQuery.data && !useCustomUrl) {
      const images: GameImageOption[] = []

      Object.entries(searchQuery.data).forEach(([, gameImages]) => {
        if (Array.isArray(gameImages)) {
          // Type assertion for the game images array
          const typedGameImages = gameImages as GameImageOption[]

          // Filter images based on include setting
          const filteredImages = includeAllTypes
            ? typedGameImages
            : typedGameImages.filter((img) => img.type === 'boxart')

          images.push(...filteredImages)
        }
      })

      setAllImages(images)

      if (images.length > 0 && !selectedImage) {
        const firstImage = images[0]
        setSelectedImage(firstImage)
        onImageSelect(firstImage.url)
      }
    }
  }, [
    searchQuery.data,
    selectedImage,
    useCustomUrl,
    includeAllTypes,
    onImageSelect,
  ])

  // Handle search errors
  useEffect(() => {
    if (searchQuery.error && onError) {
      onError(searchQuery.error.message || 'Failed to search for images')
    }
  }, [searchQuery.error, onError])

  const handleSearch = () => {
    if (searchTerm.trim().length >= 2) {
      searchQuery.refetch().catch((error) => {
        console.error('Search error:', error)
        props.onError?.(`Failed to search for images: ${error.message}`)
      })
    }
  }

  const handleImageSelect = (image: GameImageOption) => {
    setSelectedImage(image)
    onImageSelect(image.url)
  }

  const handleKeyPress = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      handleSearch()
    }
  }

  const handlePreviewImage = (
    ev: MouseEvent<HTMLButtonElement>,
    image: GameImageOption,
  ) => {
    ev.stopPropagation() // Prevent selecting the image when clicking preview
    ev.preventDefault()
    setPreviewImage(image)
  }

  const closePreview = () => {
    setPreviewImage(null)
  }

  const handleToggleAllTypes = (checked: boolean) => {
    setIncludeAllTypes(checked)
    if (searchTerm.trim().length >= 2) {
      // Re-fetch results with the new setting
      searchQuery.refetch().catch(console.error)
    }
  }

  const enableAllTypes = () => {
    setIncludeAllTypes(true)
    if (searchTerm.trim().length >= 2) {
      searchQuery.refetch().catch(console.error)
    }
  }

  const handleToggleCustomUrl = (checked: boolean) => {
    setUseCustomUrl(checked)

    // If switching to custom URL, and we have an existing selection, populate the field
    if (checked && selectedImage) {
      setCustomUrl(selectedImage.url)
    }

    // If switching back to TGDB search, and we have a custom URL, create a custom image option
    if (!checked && customUrl.trim()) {
      applyCustomUrl()
    }
  }

  const applyCustomUrl = () => {
    if (!customUrl.trim()) return

    // Create a custom image object
    const customImage: GameImageOption = {
      id: 'custom-url',
      url: customUrl,
      type: 'boxart',
      source: 'custom',
      gameId: 0,
      gameName: 'Custom URL',
    }

    setSelectedImage(customImage)
    onImageSelect(customImage.url)
  }

  const handleCustomUrlKeyPress = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      ev.preventDefault()
      applyCustomUrl()
    }
  }

  return (
    <div className={props.className}>
      <div className="flex justify-between items-center mb-4">
        <label className="font-medium text-gray-700 dark:text-gray-300">
          Game Cover Image (TheGamesDB)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Use custom URL
          </span>
          <Toggle
            checked={useCustomUrl}
            onChange={handleToggleCustomUrl}
            size="sm"
          />
        </div>
      </div>

      {useCustomUrl ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                leftIcon={<LinkIcon className="h-5 w-5" />}
                value={customUrl}
                onChange={(ev) => setCustomUrl(ev.target.value)}
                onKeyDown={handleCustomUrlKeyPress}
                placeholder="Enter image URL..."
              />
            </div>
            <Button
              type="button"
              onClick={applyCustomUrl}
              disabled={!customUrl.trim()}
              className="px-6 h-full"
            >
              Apply
            </Button>
          </div>
          {selectedImage && selectedImage.source === 'custom' && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Preview:
              </p>
              <div className="w-full max-w-xs mx-auto aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <OptimizedImage
                  src={selectedImage.url}
                  alt="Custom image preview"
                  width={200}
                  height={200}
                  objectFit="cover"
                  className="w-full h-full"
                  fallbackSrc="/placeholder/game.svg"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <Input
                leftIcon={<Search className="h-5 w-5" />}
                value={searchTerm}
                onChange={(ev) => setSearchTerm(ev.target.value)}
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

          {props.tgdbPlatformId && (
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Searching with platform filter: {props.tgdbPlatformId}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Toggle
                checked={includeAllTypes}
                onChange={handleToggleAllTypes}
                size="sm"
              />
              <span className="text-sm flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Camera className="h-4 w-4" />
                Include all image types
              </span>
            </div>

            {searchQuery.isSuccess && allImages.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {allImages.length} image
                {allImages.length !== 1 ? 's' : ''}
              </div>
            )}
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
                        src={image.url}
                        alt={getImageDisplayName(image)}
                        width={200}
                        height={200}
                        objectFit="cover"
                        className="w-full h-full"
                        fallbackSrc="/placeholder/game.svg"
                      />

                      {/* Preview Button - Shows on hover */}
                      <button
                        onClick={(ev) => handlePreviewImage(ev, image)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Preview image"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              getImageTypeClassName(image.type),
                            )}
                          >
                            {getImageTypeDisplayName(image.type)}
                          </span>
                          <span
                            className="text-xs truncate"
                            title={image.gameName}
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
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  No {!includeAllTypes ? 'boxart images' : 'images'} found for
                  &ldquo;{searchTerm}&rdquo;.
                </p>
                {!includeAllTypes && (
                  <div className="mt-2">
                    <Button
                      onClick={enableAllTypes}
                      variant="outline"
                      size="sm"
                      className="text-sm flex items-center gap-1"
                    >
                      <Camera className="h-4 w-4" />
                      Include all image types
                    </Button>
                  </div>
                )}
                {includeAllTypes && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Try a different search term or toggle to &ldquo;Use custom
                    URL&rdquo; above.
                  </p>
                )}
              </div>
            )}
        </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={closePreview}
          title={previewImage.gameName}
          size="lg"
          isNested={true}
        >
          <div className="space-y-4">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <OptimizedImage
                src={previewImage.url}
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
                <span
                  className={`text-sm px-3 py-1 rounded text-white ${
                    previewImage.type === 'boxart'
                      ? 'bg-blue-600'
                      : previewImage.type === 'fanart'
                        ? 'bg-purple-600'
                        : previewImage.type === 'screenshot'
                          ? 'bg-green-600'
                          : previewImage.type === 'banner'
                            ? 'bg-orange-600'
                            : previewImage.type === 'clearlogo'
                              ? 'bg-pink-600'
                              : 'bg-gray-600'
                  }`}
                >
                  {getImageTypeDisplayName(previewImage.type)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {previewImage.width && previewImage.height
                    ? `${previewImage.width} × ${previewImage.height}`
                    : 'Resolution unknown'}
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

export default TGDBImageSelector
