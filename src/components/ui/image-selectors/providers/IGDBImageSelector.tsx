'use client'

import { Search, Eye, Image as ImageIcon, Sparkles } from 'lucide-react'
import { useState, useEffect, type KeyboardEvent } from 'react'
import { Button, LoadingSpinner, OptimizedImage, Modal, Input, Badge } from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import getImageUrl from '@/utils/getImageUrl'

interface IGDBImage {
  url: string
  type: 'cover' | 'artwork' | 'screenshot' | 'banner'
  width?: number
  height?: number
  label: string
}

interface Props {
  gameTitle?: string
  igdbGameId?: number
  selectedImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

function getImageTypeClassName(imageType: string) {
  return imageType === 'cover'
    ? 'bg-blue-600'
    : imageType === 'artwork'
      ? 'bg-purple-600'
      : imageType === 'screenshot'
        ? 'bg-green-600'
        : imageType === 'banner'
          ? 'bg-orange-600'
          : 'bg-gray-600'
}

function getImageTypeIcon(imageType: string) {
  return imageType === 'cover'
    ? '🎮'
    : imageType === 'artwork'
      ? '🎨'
      : imageType === 'screenshot'
        ? '📸'
        : imageType === 'banner'
          ? '🖼️'
          : '🖼️'
}

export function IGDBImageSelector({ onImageSelect, onError, ...props }: Props) {
  const [searchTerm, setSearchTerm] = useState(props.gameTitle ?? '')
  const [selectedImage, setSelectedImage] = useState<IGDBImage | null>(null)
  const [allImages, setAllImages] = useState<IGDBImage[]>([])
  const [previewImage, setPreviewImage] = useState<IGDBImage | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(props.igdbGameId ?? null)

  // Debounced search to avoid API spam
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  // Search for games
  const searchQuery = api.igdb.searchGames.useQuery(
    { query: debouncedSearchTerm, limit: 10 },
    {
      enabled: debouncedSearchTerm.length >= 2 && !selectedGameId,
      staleTime: 5 * 60 * 1000,
    },
  )

  // Get images for selected game
  const imagesQuery = api.igdb.getGameImages.useQuery(
    { gameId: selectedGameId! },
    {
      enabled: !!selectedGameId,
      staleTime: 5 * 60 * 1000,
    },
  )

  // Update search term when gameTitle prop changes
  useEffect(() => {
    if (props.gameTitle && props.gameTitle !== searchTerm) {
      setSearchTerm(props.gameTitle)
    }
  }, [props.gameTitle, searchTerm])

  // Update selected game ID when prop changes
  useEffect(() => {
    if (props.igdbGameId && props.igdbGameId !== selectedGameId) {
      setSelectedGameId(props.igdbGameId)
    }
  }, [props.igdbGameId, selectedGameId])

  // Process images when query completes
  useEffect(() => {
    if (imagesQuery.data) {
      setAllImages(imagesQuery.data as IGDBImage[])
    }
  }, [imagesQuery.data])

  // Handle search errors
  useEffect(() => {
    if (!searchQuery.error || !onError) return
    onError(searchQuery.error.message || 'Failed to search for games')
  }, [searchQuery.error, onError])

  // Handle images fetch errors
  useEffect(() => {
    if (!imagesQuery.error || !onError) return
    onError(imagesQuery.error.message || 'Failed to fetch game images')
  }, [imagesQuery.error, onError])

  const handleSearch = () => {
    if (searchTerm.trim().length >= 2) {
      setSelectedGameId(null)
      searchQuery.refetch().catch((error) => {
        console.error('Search error:', error)
        onError?.('Failed to search for games')
      })
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleGameSelect = (gameId: number) => {
    setSelectedGameId(gameId)
  }

  const handleImageSelect = (image: IGDBImage) => {
    setSelectedImage(image)
    onImageSelect(image.url)
  }

  const isLoading = searchQuery.isLoading || imagesQuery.isLoading

  return (
    <div className={cn('space-y-4', props.className)}>
      {/* Search Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for a game on IGDB..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Sparkles className="h-3 w-3" />
          <span>Powered by IGDB - Comprehensive game database with rich media</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Game Selection (if searching) */}
      {!selectedGameId && searchQuery.data && searchQuery.data.games.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a game:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {searchQuery.data.games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {game.boxartUrl && (
                    <OptimizedImage
                      src={getImageUrl(game.boxartUrl)}
                      alt={game.name}
                      width={40}
                      height={60}
                      className="w-10 h-15 object-cover rounded"
                      quality={75}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {game.name}
                    </p>
                    {game.releaseDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(game.releaseDate).getFullYear()}
                      </p>
                    )}
                    {game.isErotic && (
                      <Badge variant="danger" size="sm" className="mt-1">
                        NSFW
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!selectedGameId && searchQuery.data && searchQuery.data.games.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No games found for &quot;{searchTerm}&quot;</p>
          <p className="text-sm mt-1">Try different search terms</p>
        </div>
      )}

      {/* Image Grid (when game selected) */}
      {selectedGameId && allImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Images ({allImages.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedGameId(null)
                setAllImages([])
              }}
            >
              ← Back to search
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allImages.map((image, index) => (
              <div
                key={index}
                className={cn(
                  'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                  selectedImage?.url === image.url
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
                )}
                onClick={() => handleImageSelect(image)}
              >
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 relative">
                  <OptimizedImage
                    src={getImageUrl(image.url)}
                    alt={image.label}
                    width={200}
                    height={267}
                    className="absolute inset-0 w-full h-full"
                    imageClassName="w-full h-full object-cover"
                    objectFit="cover"
                    quality={75}
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewImage(image)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Image Type Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded',
                      getImageTypeClassName(image.type),
                    )}
                  >
                    <span>{getImageTypeIcon(image.type)}</span>
                    {image.type}
                  </span>
                </div>

                {/* Selected Indicator */}
                {selectedImage?.url === image.url && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Dimensions */}
                {image.width && image.height && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs text-white bg-black bg-opacity-60 px-1 py-0.5 rounded">
                      {image.width}×{image.height}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Display */}
      {selectedImage && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected:</p>
          <div className="flex items-center gap-3">
            <OptimizedImage
              src={getImageUrl(selectedImage.url)}
              alt="Selected"
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded border"
              quality={75}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedImage.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {selectedImage.url}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.label || 'Image Preview'}
      >
        {previewImage && (
          <div className="space-y-4">
            <div className="relative w-full" style={{ minHeight: '400px' }}>
              <OptimizedImage
                src={getImageUrl(previewImage.url)}
                alt={previewImage.label}
                width={800}
                height={600}
                objectFit="contain"
                className="w-full h-auto object-contain"
                quality={75}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPreviewImage(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleImageSelect(previewImage)
                  setPreviewImage(null)
                }}
              >
                Select This Image
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
