'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Database, Zap, Link, X, Check, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import getImageUrl from '@/utils/getImageUrl'
import {
  validateImageUrl,
  getImageValidationError,
  IMAGE_EXTENSIONS,
} from '@/utils/imageValidation'
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
  label?: string
  placeholder?: string
}

type ImageService = 'url' | 'rawg' | 'tgdb' | 'igdb'

const imageServiceMap: Record<ImageService, ImageService> = {
  url: 'url',
  rawg: 'rawg',
  tgdb: 'tgdb',
  igdb: 'igdb',
}

export function AdminImageSelectorSwitcher(props: Props) {
  const [selectedService, setSelectedService] = useState<ImageService>(imageServiceMap.url)
  const [manualUrl, setManualUrl] = useState(props.selectedImageUrl || '')
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [showApplied, setShowApplied] = useState(false)

  const validateUrl = (url: string) => {
    const result = validateImageUrl(url)
    setIsValidUrl(result.isValid)
    return result.isValid
  }

  const handleManualUrlChange = (url: string) => {
    setManualUrl(url)
    const trimmedUrl = url.trim()
    return trimmedUrl ? validateUrl(trimmedUrl) : setIsValidUrl(false)
  }

  const handleManualUrlSubmit = () => {
    const trimmedUrl = manualUrl.trim()
    if (trimmedUrl && validateUrl(trimmedUrl)) {
      props.onImageSelect(trimmedUrl)
      setShowApplied(true)
      setTimeout(() => {
        setShowApplied(false)
      }, 1500)
    } else if (trimmedUrl === '') {
      props.onImageSelect('')
    } else {
      props.onError?.(getImageValidationError(trimmedUrl))
    }
  }

  const handleClearUrl = () => {
    setManualUrl('')
    setIsValidUrl(false)
    props.onImageSelect('')
  }

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    animate: { x: 0, opacity: 1, transition: { stiffness: 300, damping: 30 } },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: { stiffness: 300, damping: 30 },
    }),
  }

  return (
    <div className={props.className}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {props.label}
        </label>
      )}

      {/* Service Selector */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedService('url')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedService === 'url'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Link
                className={`h-5 w-5 mx-auto mb-1 ${
                  selectedService === 'url' ? 'text-blue-500' : 'text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  selectedService === 'url'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Manual URL
              </div>
            </button>

            <button
              onClick={() => setSelectedService('rawg')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedService === 'rawg'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Zap
                className={`h-5 w-5 mx-auto mb-1 ${
                  selectedService === 'rawg' ? 'text-orange-500' : 'text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  selectedService === 'rawg'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                RAWG.io
              </div>
            </button>

            <button
              onClick={() => setSelectedService('tgdb')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedService === 'tgdb'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Database
                className={`h-5 w-5 mx-auto mb-1 ${
                  selectedService === 'tgdb' ? 'text-blue-500' : 'text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  selectedService === 'tgdb'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                TheGamesDB
              </div>
            </button>

            <button
              onClick={() => setSelectedService('igdb')}
              className={`p-3 rounded-lg border-2 transition-all relative ${
                selectedService === 'igdb'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Sparkles
                className={`h-5 w-5 mx-auto mb-1 ${
                  selectedService === 'igdb' ? 'text-purple-500' : 'text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  selectedService === 'igdb'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                IGDB
              </div>
              <span className="absolute -top-1 -right-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 rounded text-[10px]">
                NEW
              </span>
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {selectedService === 'url' && 'Enter image URL manually'}
            {selectedService === 'rawg' && 'Using RAWG.io for game images'}
            {selectedService === 'tgdb' && 'Using TheGamesDB for game images'}
            {selectedService === 'igdb' && 'Using IGDB for comprehensive game media'}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {selectedService === 'url' &&
              `Paste any image URL (${IMAGE_EXTENSIONS.join(', ')}) from the web`}
            {selectedService === 'rawg' &&
              'RAWG.io provides comprehensive game data with screenshots and backgrounds'}
            {selectedService === 'tgdb' &&
              'TheGamesDB offers high-quality boxart and game media from the community'}
            {selectedService === 'igdb' &&
              'IGDB provides rich media including covers, artworks, and screenshots with detailed metadata'}
          </div>
        </div>
      </div>

      {/* Animated Content */}
      <div className="relative overflow-hidden">
        <AnimatePresence
          mode="wait"
          custom={selectedService === 'tgdb' ? 1 : selectedService === 'rawg' ? 0 : -1}
        >
          {selectedService === 'url' ? (
            <motion.div
              key="url"
              custom={-1}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={manualUrl}
                    onChange={(e) => handleManualUrlChange(e.target.value)}
                    placeholder={props.placeholder || 'https://example.com/image.jpg'}
                    className={`flex-1 transition-all duration-200 ${
                      manualUrl.trim() && !isValidUrl
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : isValidUrl
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {manualUrl.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearUrl}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleManualUrlSubmit}
                    disabled={!!(manualUrl.trim() && !isValidUrl)}
                    size="sm"
                    className={`px-4 transition-all duration-200 ${
                      showApplied ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                    }`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {showApplied ? 'Applied ✓' : 'Apply'}
                  </Button>
                </div>

                {manualUrl.trim() && !isValidUrl && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {getImageValidationError(manualUrl.trim())}
                  </motion.p>
                )}

                {props.selectedImageUrl && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current image:</p>
                    <div className="flex items-center gap-3">
                      <Image
                        src={getImageUrl(props.selectedImageUrl)}
                        alt="Selected image preview"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        unoptimized
                      />
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400 break-all">
                        {props.selectedImageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : selectedService === 'rawg' ? (
            <motion.div
              key="rawg"
              custom={0}
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
          ) : selectedService === 'igdb' ? (
            <motion.div
              key="igdb"
              custom={2}
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
