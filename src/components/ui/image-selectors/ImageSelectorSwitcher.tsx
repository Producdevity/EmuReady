'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Database, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IGDBImageSelector } from './providers/IGDBImageSelector'
import { RawgImageSelector } from './providers/RawgImageSelector'
import { TGDBImageSelector } from './providers/TGDBImageSelector'

interface Props {
  gameTitle?: string
  systemName?: string
  tgdbPlatformId?: number
  selectedImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

type ImageService = 'rawg' | 'tgdb' | 'igdb'

const imageServiceMap: Record<ImageService, ImageService> = {
  rawg: 'rawg',
  tgdb: 'tgdb',
  igdb: 'igdb',
}

const imageServiceDirection: Record<ImageService, number> = {
  rawg: -1,
  tgdb: 0,
  igdb: 1,
}

export function ImageSelectorSwitcher(props: Props) {
  const [selectedService, setSelectedService] = useState<ImageService>(imageServiceMap.tgdb)

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { stiffness: 300, damping: 30 },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: { stiffness: 300, damping: 30 },
    }),
  }

  return (
    <div className={props.className}>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedService(imageServiceMap.rawg)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                selectedService === imageServiceMap.rawg
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              )}
            >
              <Zap className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <div
                className={cn(
                  'text-sm font-medium mt-1',
                  selectedService === imageServiceMap.rawg
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300',
                )}
              >
                RAWG.io
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedService(imageServiceMap.tgdb)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                selectedService === imageServiceMap.tgdb
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              )}
            >
              <Database className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div
                className={cn(
                  'text-sm font-medium mt-1',
                  selectedService === imageServiceMap.tgdb
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300',
                )}
              >
                TheGamesDB
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                Experimental
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedService(imageServiceMap.igdb)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all relative',
                selectedService === imageServiceMap.igdb
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              )}
            >
              <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <div
                className={cn(
                  'text-sm font-medium mt-1',
                  selectedService === imageServiceMap.igdb
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300',
                )}
              >
                IGDB
              </div>
              <span className="absolute -top-1 -right-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 rounded text-[10px]">
                NEW
              </span>
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {selectedService === imageServiceMap.rawg
              ? 'Using RAWG.io for game images'
              : selectedService === imageServiceMap.tgdb
                ? 'Using TheGamesDB for game images'
                : 'Using IGDB for comprehensive game media'}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {selectedService === imageServiceMap.rawg &&
              'RAWG.io provides comprehensive game data with screenshots and backgrounds'}
            {selectedService === imageServiceMap.tgdb &&
              'TheGamesDB offers high-quality boxart and game media from the community'}
            {selectedService === imageServiceMap.igdb &&
              'IGDB provides rich media including covers, artworks, and screenshots with detailed metadata'}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={imageServiceDirection[selectedService]}>
          {selectedService === imageServiceMap.rawg ? (
            <motion.div
              key="rawg"
              custom={imageServiceDirection.rawg}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <RawgImageSelector
                gameTitle={props.gameTitle}
                systemName={props.systemName}
                selectedImageUrl={props.selectedImageUrl}
                onImageSelect={props.onImageSelect}
                onError={props.onError}
              />
            </motion.div>
          ) : selectedService === imageServiceMap.igdb ? (
            <motion.div
              key="igdb"
              custom={imageServiceDirection.igdb}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <IGDBImageSelector
                gameTitle={props.gameTitle}
                selectedImageUrl={props.selectedImageUrl}
                onImageSelect={props.onImageSelect}
                onError={props.onError}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tgdb"
              custom={imageServiceDirection.tgdb}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TGDBImageSelector
                gameTitle={props.gameTitle}
                tgdbPlatformId={props.tgdbPlatformId}
                selectedImageUrl={props.selectedImageUrl}
                onImageSelect={props.onImageSelect}
                onError={props.onError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
