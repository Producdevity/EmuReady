'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import getImageUrl from '@/utils/getImageUrl'

interface Props {
  game: {
    id: string
    title: string
    imageUrl?: string | null
    boxartUrl?: string | null
    bannerUrl?: string | null
  }
  className?: string
  sizes?: string
  priority?: boolean
  aspectRatio?: 'square' | 'video' | 'poster' | 'auto'
  showFallback?: boolean
}

export function GameImage(props: Props) {
  const [imageError, setImageError] = useState(false)
  // Prioritize boxart > banner > imageUrl as per the existing utility function logic
  const displayImageUrl = props.game.boxartUrl ?? props.game.bannerUrl ?? props.game.imageUrl
  const imageUrl = getImageUrl(displayImageUrl ?? null, props.game.title)
  const hasImage = !!(props.game.boxartUrl || props.game.bannerUrl || props.game.imageUrl)

  // Determine aspect ratio class based on prop
  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    poster: 'aspect-[3/4]',
    auto: '',
  }[props.aspectRatio ?? 'auto']

  // If no image is available and we're not showing fallback, return null
  if (!hasImage && !props.showFallback) return null

  // If there's an error or no image, show fallback
  if (imageError || !hasImage) {
    return (
      <div
        className={cn(
          'relative bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center',
          aspectRatioClass,
          props.className,
        )}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">🎮</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-2">
            {props.game.title}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass, props.className)}>
      <Image
        src={imageUrl}
        alt={props.game.title}
        fill
        className="object-cover"
        sizes={props.sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        priority={props.priority ?? false}
        onError={() => setImageError(true)}
      />
    </div>
  )
}
