'use client'

import { type ImageProps } from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import getImageUrl from '@/utils/getImageUrl'
import { ImageRenderer } from './ImageRenderer'
import { LoadingSpinner } from './LoadingSpinner'

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
  preload?: ImageProps['preload']
  unoptimized?: ImageProps['unoptimized']
  loading?: ImageProps['loading']
  fetchPriority?: ImageProps['fetchPriority']
  quality?: 50 | 75 | 85 | 100
  fallbackSrc?: string
  objectFit?: ObjectFit
}

export function OptimizedImage(props: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const fallbackSrc = props.fallbackSrc ?? '/placeholder/game.svg'

  const resolveSrc = (): string => {
    if (error) return fallbackSrc
    return getImageUrl(props.src, null)
  }

  useEffect(() => {
    setIsLoading(true)
    setError(false)
  }, [props.src, fallbackSrc])

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
      <ImageRenderer
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
        preload={props.preload}
        fetchPriority={props.fetchPriority}
        quality={props.quality ?? 75}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        loading={props.loading ?? undefined}
        unoptimized={props.unoptimized ?? false}
      />
    </div>
  )
}
