import { motion } from 'framer-motion'
import { Eye, ImageIcon, Plus, CheckCircle, ExternalLink } from 'lucide-react'
import { memo } from 'react'
import { Button, OptimizedImage } from '@/components/ui'
import { formatYear } from '@/utils/date'
import { extractBoxartUrl, formatPlatformName } from '../utils/boxartHelpers'
import { inferRatingAndNsfw } from '../utils/nsfwHelpers'
import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

interface Props {
  game: TGDBGame
  searchResponse: TGDBGamesByNameResponse
  onPreview: (game: TGDBGame) => void
  onSelect: (
    game: TGDBGame,
    extras: { ageRating?: string; isErotic: boolean },
  ) => void
  isSelecting: boolean
  existingGames: Record<
    number,
    { id: string; title: string; systemName: string }
  >
}

const SearchResultsCard = memo(function SearchResultsCard(props: Props) {
  const boxartUrl = extractBoxartUrl(props.game, props.searchResponse)
  const platforms = props.searchResponse.include?.platform?.data
    ? Object.values(props.searchResponse.include.platform.data)
        .filter((platform) => platform.id === props.game.platform)
        .map((platform) => platform.name)
    : []

  // Check if this game already exists in the database
  const existingGame = props.existingGames[props.game.id]
  const isExisting = Boolean(existingGame)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden group hover:shadow-lg transition-shadow duration-300 flex flex-col h-full ${
        isExisting
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="aspect-square relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {boxartUrl ? (
          <OptimizedImage
            src={boxartUrl}
            alt={props.game.game_title}
            width={300}
            height={300}
            objectFit="cover"
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            imageClassName="w-full h-auto"
            fallbackSrc="/placeholder/game.svg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon
              className="h-12 w-12 text-slate-400 dark:text-slate-600"
              aria-label="No game image available"
            />
          </div>
        )}

        {/* Existing game indicator */}
        {isExisting && (
          <div className="absolute top-3 left-3">
            <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation()
                props.onPreview(props.game)
              }}
              className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Preview game"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between">
        <div className="flex-grow">
          <h3 className="font-medium text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight">
            {props.game.game_title}
          </h3>

          <div className="space-y-2 mb-4">
            {platforms.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                  {formatPlatformName(platforms)}
                </span>
              </div>
            )}

            {props.game.release_date && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Released {formatYear(props.game.release_date)}
              </div>
            )}

            {isExisting && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Already in database
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {isExisting ? (
            <Button
              onClick={() =>
                window.open(
                  `/games/${existingGame.id}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              variant="outline"
              size="sm"
              className="w-full border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Game
            </Button>
          ) : (
            <Button
              onClick={() =>
                props.onSelect(props.game, inferRatingAndNsfw(props.game))
              }
              disabled={props.isSelecting}
              variant="primary"
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add This Game
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
})

export default SearchResultsCard
