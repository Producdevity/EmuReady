'use client'

import { AlertTriangle, Calendar, Gamepad2, Image as ImageIcon, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Badge, Autocomplete } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import type { AutocompleteOptionBase } from '@/components/ui/form/Autocomplete'
import type { System } from '@orm'

interface IGDBGameResult {
  id: number
  name: string
  summary?: string | null
  storyline?: string
  releaseDate?: string | Date | null
  platforms?: Array<{ name: string }>
  genres?: Array<{ name: string }>
  themes?: Array<{ id: number; name: string }>
  cover?: { url: string }
  artworks?: Array<{ url: string }>
  screenshots?: Array<{ url: string }>
  imageUrl: string | null
  boxartUrl: string | null
  bannerUrl: string | null
  isErotic: boolean
}

interface SystemOption extends AutocompleteOptionBase {
  id: string
  name: string
}

interface Props {
  game: IGDBGameResult | null
  isOpen: boolean
  onClose: () => void
  onSelect: (systemId: string) => void
  systems: System[]
  isSelecting: boolean
  existingGames: Record<string, string>
  currentSystemId?: string
}

export default function IGDBGamePreviewModal(props: Props) {
  const { game, isOpen, onClose, onSelect, systems, isSelecting, existingGames, currentSystemId } =
    props
  const [selectedSystemId, setSelectedSystemId] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  if (!game) return null

  const releaseYear = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null
  const systemIdToUse = currentSystemId || selectedSystemId
  const existingGameId = systemIdToUse ? existingGames[`${game.name}_${systemIdToUse}`] : null

  // Helper function to ensure URL has protocol
  const ensureAbsoluteUrl = (url: string): string => {
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    return url
  }

  // Collect all available images
  const allImages: { url: string; type: string }[] = []
  if (game.boxartUrl) allImages.push({ url: ensureAbsoluteUrl(game.boxartUrl), type: 'Cover' })
  if (game.bannerUrl) allImages.push({ url: ensureAbsoluteUrl(game.bannerUrl), type: 'Banner' })
  if (game.artworks) {
    game.artworks.forEach((artwork, idx) => {
      allImages.push({ url: ensureAbsoluteUrl(artwork.url), type: `Artwork ${idx + 1}` })
    })
  }
  if (game.screenshots) {
    game.screenshots.forEach((screenshot, idx) => {
      allImages.push({ url: ensureAbsoluteUrl(screenshot.url), type: `Screenshot ${idx + 1}` })
    })
  }

  const currentImage = allImages[activeImageIndex] || {
    url: game.imageUrl ? ensureAbsoluteUrl(game.imageUrl) : '',
    type: 'Default',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {game.name}
            {game.isErotic && (
              <Badge variant="danger">
                <AlertTriangle className="h-3 w-3 mr-1" />
                NSFW
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image Section */}
          <div>
            <div className="aspect-[3/4] relative bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
              {currentImage.url ? (
                <Image
                  src={currentImage.url}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Available Images ({allImages.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`px-2 py-1 text-xs rounded ${
                        idx === activeImageIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {img.type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-sm">
              {releaseYear && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>{releaseYear}</span>
                </div>
              )}
              {game.platforms && game.platforms.length > 0 && (
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Gamepad2 className="h-4 w-4" />
                  <span>{game.platforms.length} platforms</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Genres
                </p>
                <div className="flex flex-wrap gap-1">
                  {game.genres.map((genre, index) => (
                    <Badge key={index} variant="default" size="sm">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {(game.summary || game.storyline) && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {game.summary || game.storyline}
                </p>
              </div>
            )}

            {/* System Selection - Only show if not already selected */}
            {!currentSystemId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select System *
                </label>
                <Autocomplete<SystemOption>
                  placeholder="Choose the system for this game..."
                  value={selectedSystemId}
                  onChange={(value) => setSelectedSystemId(value ?? '')}
                  items={systems}
                  optionToValue={(option) => option.id}
                  optionToLabel={(option) => option.name}
                  filterKeys={['name']}
                  minCharsToTrigger={0}
                  className="w-full"
                />
              </div>
            )}

            {/* Show selected system if already chosen */}
            {currentSystemId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Selected System
                </label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm font-medium">
                    {systems.find((s) => s.id === currentSystemId)?.name || 'Unknown System'}
                  </span>
                </div>
              </div>
            )}

            {/* NSFW Warning */}
            {game.isErotic && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium">Adult Content Warning</p>
                    <p>This game has been flagged as containing adult/NSFW content.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSelecting}
                className="w-full sm:w-auto sm:min-w-[100px]"
              >
                Cancel
              </Button>
              {existingGameId ? (
                <Link href={`/listings/new?gameId=${existingGameId}`} className="w-full sm:flex-1">
                  <Button variant="outline" className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Go to Existing Game
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => {
                    const systemId = currentSystemId || selectedSystemId
                    if (systemId) onSelect(systemId)
                  }}
                  disabled={(!currentSystemId && !selectedSystemId) || isSelecting}
                  isLoading={isSelecting}
                  className="w-full sm:flex-1 whitespace-nowrap"
                >
                  Add Game &amp; Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
