'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { parseMarkdown, hasMarkdownSyntax } from '@/utils/markdown'
import { MARKDOWN_PROSE_CLASSES } from './markdownProseClasses'

interface Props {
  content: string
  className?: string
  fallbackToPlainText?: boolean
}

export function MarkdownRenderer(props: Props) {
  const hasMarkdown = useMemo(() => hasMarkdownSyntax(props.content), [props.content])
  const shouldRenderPlainText = props.fallbackToPlainText && !hasMarkdown

  const renderedContent = useMemo(() => {
    if (!props.content) return ''

    if (shouldRenderPlainText) return ''

    return parseMarkdown(props.content)
  }, [props.content, shouldRenderPlainText])

  if (shouldRenderPlainText) {
    return (
      <div className={cn(...MARKDOWN_PROSE_CLASSES, 'whitespace-pre-wrap', props.className)}>
        {props.content}
      </div>
    )
  }

  return (
    <div
      className={cn(...MARKDOWN_PROSE_CLASSES, props.className)}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}
