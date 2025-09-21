'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui'
import { cn } from '@/lib/utils'

type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'

const objectFitMap: Record<ObjectFit, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
}

interface Props {
  src: string
  alt: ImageProps['alt']
  width?: number
  height?: number
  className?: string
  imageClassName?: string
  priority?: ImageProps['priority']
  unoptimized?: ImageProps['unoptimized']
  loading?: ImageProps['loading']
  quality?: 50 | 75 | 85 | 100
  fallbackSrc?: string
  objectFit?: ObjectFit
  useProxy?: boolean
}

export function OptimizedImage(props: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const fallbackSrc = props.fallbackSrc ?? '/placeholder/game.svg'

  const resolveSrc = (): string => {
    if (error) return fallbackSrc

    const shouldProxy = props.useProxy ?? true
    const src = props.src

    if (!shouldProxy) return src

    if (src.startsWith('/api/proxy-image')) return src

    if (src.startsWith('http://') || src.startsWith('https://')) {
      return `/api/proxy-image?url=${encodeURIComponent(src)}`
    }

    return src
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div className={cn('relative', props.className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <Image
        src={resolveSrc()}
        alt={props.alt}
        width={props.width ?? 300}
        height={props.height ?? 300}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFitMap[props.objectFit ?? 'contain'],
          props.imageClassName,
        )}
        priority={props.priority ?? false}
        quality={props.quality ?? 75}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        loading={props.loading ?? undefined}
        unoptimized={props.unoptimized ?? false}
      />
    </div>
  )
}
