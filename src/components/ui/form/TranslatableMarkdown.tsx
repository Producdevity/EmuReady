'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Earth, Globe } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { Button } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { parseMarkdown, hasMarkdownSyntax } from '@/utils/markdown'

interface Props {
  content: string
  className?: string
  preserveWhitespace?: boolean
}

export function TranslatableMarkdown(props: Props) {
  const {
    displayedContent,
    showTranslated,
    isTranslating,
    showTranslationOption,
    toggleTranslation,
    getButtonLabel,
    getTranslationInfo,
  } = useTranslation(props.content)

  // Check if the currently displayed content (original or translated) has markdown
  const displayedContentHasMarkdown = useMemo(
    () => hasMarkdownSyntax(displayedContent || ''),
    [displayedContent],
  )

  // Parse markdown for the currently displayed content if it has markdown syntax
  const parsedMarkdown = useMemo(() => {
    if (!displayedContentHasMarkdown || !displayedContent?.trim()) {
      return null
    }
    return parseMarkdown(displayedContent)
  }, [displayedContent, displayedContentHasMarkdown])

  // Use useCallback to avoid recreating this function on every render
  const renderContent = useCallback(() => {
    if (!displayedContent?.trim()) return null

    // If the displayed content (original or translated) has markdown, parse and render it
    if (displayedContentHasMarkdown && parsedMarkdown) {
      return (
        <div
          className={cn(
            'prose dark:prose-invert max-w-none',
            'prose-headings:text-gray-800 dark:prose-headings:text-gray-200',
            'prose-p:text-gray-700 dark:prose-p:text-gray-300',
            'prose-strong:text-gray-800 dark:prose-strong:text-gray-200',
            'prose-code:text-blue-600 dark:prose-code:text-blue-400',
            'prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
            'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
            'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800',
            'prose-blockquote:border-blue-200 dark:prose-blockquote:border-blue-700',
            'prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20',
            'prose-a:text-blue-600 dark:prose-a:text-blue-400',
            'prose-a:hover:text-blue-700 dark:prose-a:hover:text-blue-300',
            'prose-ul:text-gray-700 dark:prose-ul:text-gray-300',
            'prose-ol:text-gray-700 dark:prose-ol:text-gray-300',
            'prose-li:text-gray-700 dark:prose-li:text-gray-300',
            // Size adjustments for comments
            'prose-sm sm:prose-base',
            props.className,
          )}
          dangerouslySetInnerHTML={{ __html: parsedMarkdown }}
        />
      )
    }

    // If no markdown detected, render as plain text
    return (
      <div
        className={cn(
          'max-w-none',
          props.preserveWhitespace ? 'whitespace-pre-wrap' : '',
          props.className,
        )}
      >
        {displayedContent}
      </div>
    )
  }, [
    displayedContent,
    displayedContentHasMarkdown,
    parsedMarkdown,
    props.className,
    props.preserveWhitespace,
  ])

  const ButtonIcon = isTranslating ? Languages : showTranslated ? Globe : Earth

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
        >
          {renderContent()}
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
            onClick={toggleTranslation}
            disabled={isTranslating}
            className="text-xs h-7 px-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ButtonIcon className="w-3 h-3 mr-1" />
            {getButtonLabel()}
          </Button>

          {showTranslated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {getTranslationInfo()}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default TranslatableMarkdown
