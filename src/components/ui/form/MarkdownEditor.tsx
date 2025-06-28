'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold,
  Italic,
  Strikethrough,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Eye,
  EyeOff,
  HelpCircle,
} from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'

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
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { value, onChange } = props

  // Helper function to insert text at cursor position
  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value?.substring(start, end) || ''
      const textToInsert = selectedText || placeholder

      const newText =
        value?.substring(0, start) +
        before +
        textToInsert +
        after +
        value?.substring(end)

      onChange(newText || '')

      // Set cursor position after insertion
      setTimeout(() => {
        const newCursorPos = start + before.length + textToInsert.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    },
    [value, onChange],
  )

  // Toolbar button handlers
  const handleBold = () => insertText('**', '**', 'bold text')
  const handleItalic = () => insertText('*', '*', 'italic text')
  const handleStrikethrough = () => insertText('~~', '~~', 'strikethrough text')
  const handleCode = () => insertText('`', '`', 'code')
  const handleLink = () =>
    insertText('[', '](https://example.com)', 'link text')
  const handleBulletList = () => insertText('- ', '', 'list item')
  const handleNumberedList = () => insertText('1. ', '', 'list item')
  const handleQuote = () => insertText('> ', '', 'quoted text')

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
  }: {
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-md transition-colors duration-150',
        'text-gray-600 dark:text-gray-400',
        'hover:text-gray-800 dark:hover:text-gray-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
      disabled={props.disabled}
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="space-y-2">
      {/* Label */}
      {props.label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {props.label}
        </label>
      )}

      {/* Editor Container */}
      <div
        className={cn(
          'border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden',
          'bg-white dark:bg-gray-800',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
          props.error &&
            'border-red-500 focus-within:ring-red-500 focus-within:border-red-500',
          props.disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={handleBold} icon={Bold} title="Bold" />
            <ToolbarButton
              onClick={handleItalic}
              icon={Italic}
              title="Italic"
            />
            <ToolbarButton
              onClick={handleStrikethrough}
              icon={Strikethrough}
              title="Strikethrough"
            />
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton onClick={handleLink} icon={Link} title="Link" />
            <ToolbarButton
              onClick={handleCode}
              icon={Code}
              title="Inline Code"
            />
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
              onClick={handleBulletList}
              icon={List}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={handleNumberedList}
              icon={ListOrdered}
              title="Numbered List"
            />
            <ToolbarButton onClick={handleQuote} icon={Quote} title="Quote" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors',
                'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
              disabled={props.disabled}
            >
              {showPreview ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showPreview ? 'Edit' : 'Preview'}
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'p-1 rounded-md transition-colors',
                'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
              title="Markdown Help"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          {showPreview ? (
            <div className="p-3 min-h-[120px] max-h-[400px] overflow-y-auto">
              {props.value?.trim() ? (
                <MarkdownRenderer content={props.value} />
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  Nothing to preview
                </div>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              id={props.id}
              value={props.value || ''}
              onChange={(e) => props.onChange(e.target.value)}
              placeholder={props.placeholder || 'Write your comment...'}
              rows={props.rows || 4}
              maxLength={props.maxLength}
              disabled={props.disabled}
              className={cn(
                'w-full p-3 resize-none border-0 focus:outline-none',
                'bg-transparent text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'disabled:cursor-not-allowed',
                props.className,
              )}
              style={{ minHeight: '120px', maxHeight: '400px' }}
            />
          )}
        </div>
      </div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              Markdown Formatting:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <code>**bold**</code> → <strong>bold</strong>
              </div>
              <div>
                <code>*italic*</code> → <em>italic</em>
              </div>
              <div>
                <code>~~strike~~</code> → <del>strike</del>
              </div>
              <div>
                <code>`code`</code> → <code>code</code>
              </div>
              <div>
                <code>[link](url)</code> → link
              </div>
              <div>
                <code>- item</code> → • item
              </div>
              <div>
                <code>1. item</code> → 1. item
              </div>
              <div>
                <code>&gt; quote</code> → blockquote
              </div>
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
        <div className="flex justify-end">
          <span
            className={cn(
              'text-xs',
              (props.value || '').length > props.maxLength * 0.9
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

export default MarkdownEditor
