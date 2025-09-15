'use client'

import { TranslatableMarkdown } from '@/components/ui'

interface Props {
  title?: string
  content?: string | null
}

export function NotesSection(props: Props) {
  const title = props.title ?? 'Notes'
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</h2>
      {props.content ? (
        <TranslatableMarkdown
          content={props.content}
          className="text-gray-600 dark:text-gray-300 text-base leading-relaxed"
          preserveWhitespace
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
          No notes provided.
        </p>
      )}
    </div>
  )
}
