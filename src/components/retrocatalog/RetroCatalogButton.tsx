'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { RetroCatalogIconAnimated } from './RetroCatalogIconAnimated'
import { useRetroCatalogDevice } from './useRetroCatalogDevice'

type AnalyticsSource =
  | 'device_view_modal'
  | 'listing_details'
  | 'devices_table'
  | 'listing_card'
  | 'trending_devices'

interface Props {
  deviceId: string
  brandName: string
  modelName: string
  variant?: 'pill' | 'button' | 'icon-only' | 'badge'
  analyticsSource: AnalyticsSource
  className?: string
}

/**
 * RetroCatalog specs button - shows only when device exists on RetroCatalog
 * Opens device specs in new tab with tasteful hover animations
 */
export function RetroCatalogButton(props: Props) {
  const { deviceId, brandName, modelName, variant = 'pill' } = props
  const [isHovered, setIsHovered] = useState(false)

  const { exists, url, isLoading } = useRetroCatalogDevice({
    brandName,
    modelName,
  })

  if (isLoading || !exists || !url) return null

  const handleClick = () => {
    analytics.contentDiscovery.retroCatalogSpecsClicked({
      deviceId,
      brandName,
      modelName,
      source: props.analyticsSource,
      retroCatalogUrl: url,
    })
  }

  const tooltipContent = (
    <div className="text-center">
      <p className="font-medium">View specs on RetroCatalog</p>
      <p className="text-xs opacity-80 mt-0.5">Opens in new tab</p>
    </div>
  )

  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`View ${brandName} ${modelName} specifications on RetroCatalog`}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded',
              'text-xs font-medium',
              'bg-gray-100 text-gray-800',
              'dark:bg-gray-700 dark:text-gray-300',
              'hover:bg-brand-retrocatalog/20 hover:text-brand-retrocatalog',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-brand-retrocatalog/50',
              props.className,
            )}
          >
            <RetroCatalogIconAnimated size="md" showAccent={isHovered} />
            <span>Device specs</span>
            <ExternalLink
              className={cn(
                'w-3 h-3 opacity-50 transition-all duration-200',
                isHovered && 'opacity-80',
              )}
            />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    )
  }

  if (variant === 'icon-only') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`View ${brandName} ${modelName} specifications on RetroCatalog`}
            className={cn(
              'inline-flex items-center justify-center p-1.5 rounded-md',
              'text-gray-500 dark:text-gray-400',
              'hover:text-brand-retrocatalog',
              'hover:bg-brand-retrocatalog/10',
              'transition-all duration-200 ease-out',
              'hover:scale-105',
              'focus:outline-none focus:ring-2 focus:ring-brand-retrocatalog/50',
              props.className,
            )}
          >
            <RetroCatalogIconAnimated size="sm" showAccent={isHovered} />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    )
  }

  if (variant === 'button') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`View ${brandName} ${modelName} specifications on RetroCatalog`}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'hover:border-brand-retrocatalog hover:text-brand-retrocatalog',
              '[&_svg]:size-auto overflow-visible',
              props.className,
            )}
          >
            <RetroCatalogIconAnimated size="md" showAccent={isHovered} />
            <span>View Specs</span>
            <ExternalLink
              className={cn(
                'w-3.5 h-3.5 opacity-50 transition-all duration-200',
                isHovered && 'opacity-100',
              )}
            />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    )
  }

  // Default: pill variant
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label={`View ${brandName} ${modelName} specifications on RetroCatalog`}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
            'text-xs font-medium',
            'text-gray-600 dark:text-gray-300',
            'bg-gray-100 dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'hover:border-brand-retrocatalog',
            'hover:bg-brand-retrocatalog/10',
            'hover:text-brand-retrocatalog',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02]',
            'focus:outline-none focus:ring-2 focus:ring-brand-retrocatalog/50',
            props.className,
          )}
        >
          <RetroCatalogIconAnimated size="sm" showAccent={isHovered} />
          <span>Specs</span>
          <ExternalLink
            className={cn(
              'w-3 h-3 opacity-40 transition-all duration-200',
              isHovered && 'opacity-80',
            )}
          />
        </a>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}
