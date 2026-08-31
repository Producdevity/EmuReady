'use client'

import Image, { type ImageProps } from 'next/image'
import { getImageRenderMode } from '@/utils/imageUrls'
import type { CSSProperties, ImgHTMLAttributes } from 'react'

type NativeImageDimension = ImgHTMLAttributes<HTMLImageElement>['width']

type Props = Omit<ImageProps, 'priority'>

function createFillImageStyle(fill: ImageProps['fill'], style: ImageProps['style']): CSSProperties {
  if (!fill) return style ?? {}

  return {
    position: 'absolute',
    height: '100%',
    width: '100%',
    inset: 0,
    color: 'transparent',
    ...style,
  }
}

function getNativeDimension(value: ImageProps['width']): NativeImageDimension {
  if (typeof value === 'number' || typeof value === 'string') return value
  return undefined
}

export function ImageRenderer(props: Props) {
  if (typeof props.src !== 'string' || getImageRenderMode(props.src) !== 'external-img') {
    return <Image {...props} src={props.src} alt={props.alt} />
  }

  return (
    <img
      src={props.src}
      alt={props.alt}
      width={props.fill ? undefined : getNativeDimension(props.width)}
      height={props.fill ? undefined : getNativeDimension(props.height)}
      className={props.className}
      style={createFillImageStyle(props.fill, props.style)}
      loading={props.preload ? 'eager' : props.loading}
      fetchPriority={props.fetchPriority ?? (props.preload ? 'high' : undefined)}
      decoding={props.decoding ?? 'async'}
      referrerPolicy="no-referrer"
      onLoad={props.onLoad}
      onError={props.onError}
    />
  )
}
