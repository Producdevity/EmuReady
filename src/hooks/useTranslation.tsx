'use client'

import { useState, useEffect } from 'react'
import {
  translateTextCached,
  shouldShowTranslation,
  getLanguageName,
} from '@/utils/translation'
import type { TranslationResult } from '@/utils/translation.types'

/**
 * Custom hook for handling translations
 */
export function useTranslation(content: string) {
  const [showTranslated, setShowTranslated] = useState(false)
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslationOption, setShowTranslationOption] = useState(false)

  useEffect(() => {
    // Check if translation should be offered
    const shouldTranslate = shouldShowTranslation(content)
    setShowTranslationOption(shouldTranslate)

    // Reset state when content changes
    setShowTranslated(false)
    setTranslation(null)
  }, [content])

  const toggleTranslation = async () => {
    if (translation) {
      setShowTranslated(!showTranslated)
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateTextCached(content)
      setTranslation(result)
      setShowTranslated(true)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const getDisplayedContent = () => {
    return showTranslated && translation ? translation.translatedText : content
  }

  const getButtonLabel = () => {
    if (isTranslating) return 'Translating...'
    if (!translation) return 'Translate'
    return showTranslated ? 'Show Original' : 'Show Translation'
  }

  const getTranslationInfo = () => {
    if (!translation) return 'Translation available'
    return showTranslated
      ? `Translated from ${getLanguageName(translation.originalLanguage)}`
      : 'Translation available'
  }

  return {
    // State
    displayedContent: getDisplayedContent(),
    showTranslated,
    translation,
    isTranslating,
    showTranslationOption,

    // Actions
    toggleTranslation,

    // UI helpers
    getButtonLabel,
    getTranslationInfo,
  }
}
