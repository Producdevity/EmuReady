'use client'

import { useState, useEffect } from 'react'
import { translateTextCached, shouldShowTranslation, getLanguageName } from '@/utils/translation'
import type { TranslationResult } from '@/utils/translation.types'

interface CachedTranslation {
  content: string
  result: TranslationResult
}

interface CachedTranslationOption {
  content: string
  show: boolean
}

interface Options {
  enabled?: boolean
}

export function useTranslation(content: string, options: Options = {}) {
  const enabled = options.enabled ?? true
  const [translatedContentKey, setTranslatedContentKey] = useState<string | null>(null)
  const [translationState, setTranslationState] = useState<CachedTranslation | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationOption, setTranslationOption] = useState<CachedTranslationOption | null>(null)

  const translation = translationState?.content === content ? translationState.result : null
  const showTranslated = translatedContentKey === content && Boolean(translation)
  const showTranslationOption =
    enabled && translationOption?.content === content ? translationOption.show : false

  useEffect(() => {
    if (!enabled || !content.trim()) return

    let cancelled = false

    async function updateTranslationOption() {
      const shouldTranslate = await shouldShowTranslation(content)
      if (!cancelled) setTranslationOption({ content, show: shouldTranslate })
    }

    void updateTranslationOption()

    return () => {
      cancelled = true
    }
  }, [content, enabled])

  const toggleTranslation = async () => {
    if (translation) {
      setTranslatedContentKey(showTranslated ? null : content)
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateTextCached(content)
      setTranslationState({ content, result })
      setTranslatedContentKey(content)
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
    if (!translation) return 'Translate (BETA)'
    return showTranslated ? 'Show Original' : 'Show Translation (BETA)'
  }

  const getTranslationInfo = () => {
    if (!translation) return 'Translation available'
    return showTranslated
      ? `Translated from ${getLanguageName(translation.originalLanguage)}`
      : 'Translation available'
  }

  return {
    displayedContent: getDisplayedContent(),
    showTranslated,
    translation,
    isTranslating,
    showTranslationOption,

    toggleTranslation,

    getButtonLabel,
    getTranslationInfo,
  }
}
