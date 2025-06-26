'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Earth, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import {
  translateTextCached,
  shouldShowTranslation,
  getLanguageName,
} from '@/utils/translation'
import type { TranslationResult } from '@/utils/translation.types'

interface Props {
  content: string
  className?: string
  preserveWhitespace?: boolean
}

export function TranslatableContent(props: Props) {
  const [showTranslated, setShowTranslated] = useState(false)
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslationOption, setShowTranslationOption] = useState(false)

  useEffect(() => {
    // Check if translation should be offered
    const shouldTranslate = shouldShowTranslation(props.content)
    setShowTranslationOption(shouldTranslate)

    // Reset state when content changes
    setShowTranslated(false)
    setTranslation(null)
  }, [props.content])

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslated(!showTranslated)
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateTextCached(props.content)
      setTranslation(result)
      setShowTranslated(true)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const getDisplayContent = () => {
    if (showTranslated && translation) {
      return translation.translatedText
    }
    return props.content
  }

  const getButtonLabel = () => {
    if (isTranslating) return 'Translating...'
    if (!translation) return 'Translate'
    return showTranslated ? 'Show Original' : 'Show Translation'
  }

  const getButtonIcon = () => {
    if (isTranslating) return Languages
    if (!translation) return Languages
    return showTranslated ? Globe : Earth
  }

  const ButtonIcon = getButtonIcon()

  if (!props.content?.trim()) return null

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={showTranslated ? 'translated' : 'original'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={props.className}
          style={
            props.preserveWhitespace ? { whiteSpace: 'pre-wrap' } : undefined
          }
        >
          {getDisplayContent()}
        </motion.div>
      </AnimatePresence>

      {showTranslationOption && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mt-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
            className="text-xs h-7 px-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ButtonIcon className="w-3 h-3 mr-1" />
            {getButtonLabel()}
          </Button>

          {translation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {showTranslated
                ? `Translated from ${getLanguageName(translation.originalLanguage)}`
                : `Translation available`}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
