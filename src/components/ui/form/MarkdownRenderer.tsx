'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { parseMarkdown, hasMarkdownSyntax } from '@/utils/markdown'

interface Props {
  content: string
  className?: string
  fallbackToPlainText?: boolean
}

export function MarkdownRenderer(props: Props) {
  const hasMarkdown = useMemo(
    () => hasMarkdownSyntax(props.content),
    [props.content],
  )

  const renderedContent = useMemo(() => {
    if (!props.content) return ''

    // If content doesn't have Markdown syntax and fallbackToPlainText is true,
    // render as plain text to maintain backward compatibility
    if (props.fallbackToPlainText && !hasMarkdown) {
      return props.content
    }

    // Parse and sanitize markdown
    return parseMarkdown(props.content)
  }, [hasMarkdown, props.content, props.fallbackToPlainText])

  // If no markdown detected and fallback is enabled, render as plain text
  if (props.fallbackToPlainText && !hasMarkdown) {
    return (
      <div
        className={cn(
          'prose dark:prose-invert max-w-none whitespace-pre-wrap',
          props.className,
        )}
      >
        {props.content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'prose dark:prose-invert max-w-none',
        // Custom styling for better integration
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
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}
