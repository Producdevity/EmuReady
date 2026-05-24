'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Earth, Globe } from 'lucide-react'
import { Button } from '@/components/ui'
import { useTranslation } from '@/hooks/useTranslation'
import { MarkdownRenderer } from './MarkdownRenderer'

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
          {displayedContent?.trim() ? (
            <MarkdownRenderer
              content={displayedContent}
              className={props.className}
              fallbackToPlainText={props.preserveWhitespace}
            />
          ) : null}
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
            icon={ButtonIcon}
            onClick={toggleTranslation}
            disabled={isTranslating}
            className="text-xs h-7 px-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
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
