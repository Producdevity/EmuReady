'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Eye, Edit3, HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { hasMarkdownSyntax } from '@/utils/markdown'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface Props {
  onChange: (value: string) => void
  value?: string
  placeholder?: string
  className?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  label?: string
  error?: string
  id?: string
}

export function MarkdownEditor(props: Props) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Auto-detect if content has markdown and suggest switching
  const [hasMarkdown, setHasMarkdown] = useState(false)

  useEffect(() => {
    if (props.value && hasMarkdownSyntax(props.value)) {
      setHasMarkdown(true)
    } else {
      setHasMarkdown(false)
    }
  }, [props.value])

  const handleModeToggle = useCallback(() => {
    setIsMarkdownMode(!isMarkdownMode)
    setShowPreview(false) // Reset preview when switching modes
  }, [isMarkdownMode])

  const handlePreviewToggle = useCallback(() => {
    setShowPreview(!showPreview)
  }, [showPreview])

  const renderContent = () => {
    if (isMarkdownMode) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {/* Markdown Editor */}
          <div className="relative">
            <MDEditor
              value={props.value}
              onChange={(val) => props.onChange(val || '')}
              preview={showPreview ? 'edit' : 'edit'}
              hideToolbar={false}
              height={props.rows ? props.rows * 24 + 80 : 200}
              data-color-mode="light"
              className={cn(
                'markdown-editor',
                props.disabled && 'opacity-50 pointer-events-none',
              )}
            />
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviewToggle}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showPreview ? (
                <Edit3 className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showPreview ? 'Edit' : 'Preview'}
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              Help
            </button>
          </div>
        </motion.div>
      )
    }

    // Rich Text Mode (Simple Textarea)
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <textarea
          id={props.id}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          maxLength={props.maxLength}
          disabled={props.disabled}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white',
            'resize-vertical transition-all duration-200',
            props.disabled && 'opacity-50 cursor-not-allowed',
            props.error && 'border-red-500 focus:ring-red-500',
            props.className,
          )}
        />
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Label and Mode Toggle */}
      <div className="flex items-center justify-between">
        {props.label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {props.label}
          </label>
        )}

        <div className="flex items-center gap-2">
          {/* Markdown Detection Hint */}
          {hasMarkdown && !isMarkdownMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-blue-600 dark:text-blue-400"
            >
              Markdown detected
            </motion.div>
          )}

          {/* Mode Toggle Button */}
          <motion.button
            type="button"
            onClick={handleModeToggle}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
              'border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isMarkdownMode
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText className="w-3 h-3" />
            {isMarkdownMode ? 'Switch to Rich Text' : 'Switch to Markdown'}
          </motion.button>
        </div>
      </div>

      {/* Editor Content */}
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && isMarkdownMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2"
          >
            <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Supported Markdown:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>**Bold text**</div>
              <div>*Italic text*</div>
              <div>[Link](https://example.com)</div>
              <div>`Inline code`</div>
              <div># Heading</div>
              <div>&gt; Blockquote</div>
              <div>- List item</div>
              <div>1. Numbered item</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {props.error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs"
        >
          {props.error}
        </motion.p>
      )}

      {/* Character Count */}
      {props.maxLength && (
        <div className="text-right">
          <span
            className={cn(
              'text-xs',
              (props.value || '').length > props.maxLength! * 0.9
                ? 'text-red-500'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            {(props.value || '').length}/{props.maxLength}
          </span>
        </div>
      )}
    </div>
  )
}
