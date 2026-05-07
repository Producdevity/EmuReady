'use client'

import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { type PlatformScope } from '@orm'

interface PlatformLike {
  id: string
  name: string
  scope: PlatformScope
}

interface Props {
  platforms: PlatformLike[]
  maxVisible?: number
  emptyLabel?: string
}

export function PlatformChipList(props: Props) {
  const maxVisible = props.maxVisible ?? 3

  if (props.platforms.length === 0) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {props.emptyLabel ?? 'Not set'}
      </span>
    )
  }

  const visible = props.platforms.slice(0, maxVisible)
  const hidden = props.platforms.slice(maxVisible)
  const hiddenNames = hidden.map((p) => p.name).join(', ')

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((platform) => (
        <PlatformBadge key={platform.id} name={platform.name} scope={platform.scope} />
      ))}
      {hidden.length > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-default"
          title={hiddenNames}
        >
          +{hidden.length}
        </span>
      ) : null}
    </div>
  )
}
