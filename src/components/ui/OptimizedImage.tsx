'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import Image from 'next/image'
import { LoadingSpinner } from '@/components/ui'

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
  alt: string
  width?: number
  height?: number
  className?: string
  imageClassName?: string
  priority?: boolean
  quality?: number
  fallbackSrc?: string
  objectFit?: ObjectFit
}

function OptimizedImage(props: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

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
        src={error ? (props.fallbackSrc ?? '/placeholder.svg') : props.src}
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
        quality={props.quality ?? 85}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  )
}

export default OptimizedImage
