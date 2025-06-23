'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

interface Props {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  placeholderSrc?: string
  width?: number
  height?: number
  loadingComponent?: ReactNode
  onLoad?: () => void
}

export function ProgressiveImage(props: Props) {
  const [imgSrc, setImgSrc] = useState(props.placeholderSrc || props.src)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // only destructure functions
  const { onLoad } = props

  useEffect(() => {
    // Reset state when src changes
    setImgLoaded(false)
    setIsLoading(true)
    setImgSrc(props.placeholderSrc || props.src)
  }, [props.src, props.placeholderSrc])

  useEffect(() => {
    // Skip if we're already using the full resolution image
    if (imgSrc === props.src && imgLoaded) return

    // Use the HTML Image constructor to preload the image
    const img = new window.Image()
    img.src = props.src

    img.onload = () => {
      setImgSrc(props.src)
      setImgLoaded(true)
      setIsLoading(false)
      if (onLoad) onLoad()
    }

    return () => {
      img.onload = null
    }
  }, [props.src, imgSrc, imgLoaded, onLoad])

  return (
    <div
      className={cn('relative overflow-hidden bg-muted/30', props.className)}
      style={{
        width: props.width ? `${props.width}px` : undefined,
        height: props.height ? `${props.height}px` : undefined,
      }}
    >
      {/* Image */}
      <Image
        src={imgSrc}
        alt={props.alt}
        width={props.width || 300}
        height={props.height || 300}
        className={cn(
          'object-cover transition-opacity duration-300 ease-in-out',
          imgLoaded ? 'opacity-100' : 'opacity-0',
          props.imgClassName,
        )}
        onLoad={() => {
          // Only mark as loaded if we're showing the full resolution image
          if (imgSrc === props.src) {
            setImgLoaded(true)
            setIsLoading(false)
          }
        }}
        onError={() => setIsLoading(false)}
        unoptimized // TEMP: until we aren't broke anymore
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          {props.loadingComponent || <LoadingSpinner size="sm" />}
        </div>
      )}
    </div>
  )
}
