'use client'

import { Star } from 'lucide-react'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { type PlatformScope } from '@orm'

interface PlatformLike {
  id: string
  name: string
  scope: PlatformScope
}

interface Props {
  platforms: PlatformLike[]
  defaultPlatform?: PlatformLike | null
  emptyLabel?: string
  className?: string
}

export function PlatformsSummary(props: Props) {
  const emptyLabel = props.emptyLabel ?? 'Not set'
  const sortedPlatforms = sortPlatformsWithDefaultFirst(props.platforms, props.defaultPlatform?.id)

  return (
    <div className={props.className}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Platform
          </p>
          {props.defaultPlatform ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" aria-hidden />
              <PlatformBadge
                name={props.defaultPlatform.name}
                scope={props.defaultPlatform.scope}
              />
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">{emptyLabel}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Supported Platforms
          </p>
          {sortedPlatforms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortedPlatforms.map((platform) => (
                <PlatformBadge
                  key={platform.id}
                  name={platform.name}
                  scope={platform.scope}
                  title={
                    platform.id === props.defaultPlatform?.id
                      ? `${platform.name} (default)`
                      : platform.name
                  }
                />
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">{emptyLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function sortPlatformsWithDefaultFirst<T extends PlatformLike>(
  platforms: T[],
  defaultPlatformId: string | undefined,
): T[] {
  if (!defaultPlatformId) return platforms
  const defaultIndex = platforms.findIndex((p) => p.id === defaultPlatformId)
  if (defaultIndex <= 0) return platforms
  const reordered = [...platforms]
  const [defaultPlatform] = reordered.splice(defaultIndex, 1)
  reordered.unshift(defaultPlatform)
  return reordered
}
