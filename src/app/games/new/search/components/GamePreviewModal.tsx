'use client'

import { Calendar, Monitor, Users, Plus, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { Modal, Button, OptimizedImage, LocalizedDate } from '@/components/ui'
import { extractBoxartUrl } from '../utils/boxartHelpers'
import { inferRatingAndNsfw } from '../utils/nsfwHelpers'
import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

interface GamePreviewModalProps {
  game: TGDBGame | null
  searchResponse: TGDBGamesByNameResponse | null
  isOpen: boolean
  onClose: () => void
  onSelect: (game: TGDBGame, extras: { isErotic: boolean }) => void
  isSelecting: boolean
}

function GamePreviewModal(props: GamePreviewModalProps) {
  const inferred = inferRatingAndNsfw(props.game ?? {})
  const [isErotic, setIsErotic] = useState(inferred.isErotic)

  if (!props.game || !props.searchResponse) return null

  const boxartUrl = extractBoxartUrl(props.game, props.searchResponse)

  const platforms = props.searchResponse.include?.platform?.data
    ? Object.values(props.searchResponse.include.platform.data)
        .filter((platform) => platform.id === props.game?.platform)
        .map((platform) => platform.name)
    : []

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Game Preview"
      closeOnBackdropClick={false}
      size="lg"
    >
      <div className="space-y-6">
        {/* Game Image and Basic Info */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-48 aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
            {boxartUrl ? (
              <OptimizedImage
                src={boxartUrl}
                alt={props.game.game_title}
                width={300}
                height={300}
                objectFit="cover"
                className="w-full h-full"
                fallbackSrc="/placeholder/game.svg"
                quality={75}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-slate-400 dark:text-slate-600" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {props.game.game_title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platforms.length > 0 && (
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Platform:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {platforms.join(', ')}
                  </span>
                </div>
              )}

              {props.game.release_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Released:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    <LocalizedDate date={props.game.release_date} format="year" />
                  </span>
                </div>
              )}

              {props.game.players && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Players:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {props.game.players}
                  </span>
                </div>
              )}

              {props.game.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Rating:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {props.game.rating}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="erotic-toggle"
                  checked={isErotic}
                  onChange={(e) => setIsErotic(e.target.checked)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="erotic-toggle"
                  className="text-sm text-slate-600 dark:text-slate-400"
                >
                  Erotic 18+
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Overview */}
        {props.game.overview && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Overview</h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {props.game.overview}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button onClick={props.onClose} variant="outline" className="flex-1">
            Close Preview
          </Button>
          <Button
            onClick={() =>
              props.game &&
              props.onSelect(props.game, {
                isErotic,
              })
            }
            disabled={props.isSelecting}
            variant="primary"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add This Game
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default GamePreviewModal
