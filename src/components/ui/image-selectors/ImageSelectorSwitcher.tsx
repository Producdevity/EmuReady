'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Database, Zap } from 'lucide-react'
import { useState } from 'react'
import { Toggle } from '@/components/ui'
import RawgImageSelector from './RawgImageSelector'
import TGDBImageSelector from './TGDBImageSelector'

interface Props {
  gameTitle?: string
  systemName?: string
  tgdbPlatformId?: number
  selectedImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

type ImageService = 'rawg' | 'tgdb'

const imageServiceMap: Record<ImageService, ImageService> = {
  rawg: 'rawg',
  tgdb: 'tgdb',
}

function ImageSelectorSwitcher(props: Props) {
  const [selectedService, setSelectedService] = useState<ImageService>(
    imageServiceMap.tgdb,
  )

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  return (
    <div className={props.className}>
      {/* Service Selector */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex flex-col items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                RAWG.io
              </span>
            </div>
            <Toggle
              checked={selectedService === imageServiceMap.tgdb}
              onChange={(checked) =>
                setSelectedService(
                  checked ? imageServiceMap.tgdb : imageServiceMap.rawg,
                )
              }
              size="md"
            />
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                TheGamesDB
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                Experimental
              </span>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {selectedService === imageServiceMap.rawg
              ? 'Using RAWG.io for game images'
              : 'Using TheGamesDB for game images'}
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {selectedService === imageServiceMap.rawg
            ? 'RAWG.io provides comprehensive game data with screenshots and backgrounds'
            : 'TheGamesDB offers high-quality boxart and game media from the community'}
        </div>
      </div>

      {/* Animated Image Selector */}
      <div className="relative overflow-hidden">
        <AnimatePresence
          mode="wait"
          custom={selectedService === 'tgdb' ? 1 : -1}
        >
          {selectedService === imageServiceMap.rawg ? (
            <motion.div
              key="rawg"
              custom={-1}
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
          ) : (
            <motion.div
              key="tgdb"
              custom={1}
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

export default ImageSelectorSwitcher
