'use client'

import { motion } from 'framer-motion'
import { Calendar, Gamepad2, AlertCircle, Check } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatters, getLocale } from '@/utils/date'
import type { GameSearchResultsProps, BaseGameResult } from './types'

function formatReleaseYear(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return 'Unknown'
    const year = d.getFullYear()
    if (year < 1970 || year > 2100) return 'Unknown'
    return formatters.year(d, getLocale())
  } catch {
    return 'Unknown'
  }
}

interface GameImageProps {
  src: string
  alt: string
}

function GameImage(props: GameImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Gamepad2 className="h-16 w-16 text-slate-300 dark:text-slate-600" />
      </div>
    )
  }

  return (
    <Image
      src={props.src}
      alt={props.alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => setHasError(true)}
    />
  )
}

export function GameSearchResults<T extends BaseGameResult>(props: GameSearchResultsProps<T>) {
  if (!props.results) return null

  const { games, count } = props.results

  if (games.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center"
      >
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No games found</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Try adjusting your search query or removing the system filter
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full overflow-hidden"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">Search Results</h2>
        <Badge variant="default" size="sm">
          {count} {count === 1 ? 'game' : 'games'} found
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {games.map((game) => {
          const gameKey = `${game.name}_${props.currentSystemId || 'all'}`
          const existingGameId = props.existingGames?.[gameKey]
          const isExisting = !!existingGameId

          return (
            <motion.div
              key={`${props.provider}-${String(game.id)}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => props.onGameSelect(game)}
              className={cn(
                'bg-white dark:bg-slate-800 rounded-lg shadow-sm border overflow-hidden cursor-pointer transition-all hover:shadow-md w-full',
                isExisting
                  ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500/20'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              {/* Image */}
              <div className="aspect-[3/4] relative bg-slate-100 dark:bg-slate-900">
                {game.imageUrl || game.boxartUrl ? (
                  <GameImage src={game.imageUrl || game.boxartUrl || ''} alt={game.name} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                  </div>
                )}

                {/* Status Badge */}
                {isExisting && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="success" size="sm" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Added
                    </Badge>
                  </div>
                )}

                {/* NSFW Badge */}
                {game.isErotic && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="danger" size="sm">
                      NSFW
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2 mb-2">
                  {game.name}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatReleaseYear(game.releaseDate)}</span>
                </div>

                {/* Genres */}
                {game.genres && game.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {game.genres.slice(0, 2).map((genre, idx) => (
                      <Badge key={`${genre.id || idx}-${genre.name}`} variant="default" size="sm">
                        {genre.name}
                      </Badge>
                    ))}
                    {game.genres.length > 2 && (
                      <Badge variant="default" size="sm">
                        +{game.genres.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Platforms */}
                {game.platforms && game.platforms.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 break-words">
                    {game.platforms
                      .slice(0, 2)
                      .map((p) => p.name)
                      .join(', ')}
                    {game.platforms.length > 2 && ` +${game.platforms.length - 2}`}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
