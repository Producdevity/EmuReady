'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { RetroCatalogIconAnimated } from './RetroCatalogIconAnimated'
import { useRetroCatalogDevice } from './useRetroCatalogDevice'

interface Props {
  brandName: string
  modelName: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
}

/**
 * RetroCatalog indicator - shows an icon when device exists on RetroCatalog
 */
export function RetroCatalogIndicator(props: Props) {
  const size = props.size ?? 'sm'

  const { exists, url, isLoading } = useRetroCatalogDevice({
    brandName: props.brandName,
    modelName: props.modelName,
  })

  if (isLoading || !exists) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'bg-brand-retrocatalog/10',
            'border border-brand-retrocatalog/30',
            'transition-all duration-200',
            'hover:bg-brand-retrocatalog/20',
            'hover:scale-105',
            paddingMap[size],
            props.className,
          )}
          onClick={(ev) => ev.stopPropagation()}
          onMouseDown={(ev) => ev.stopPropagation()}
        >
          <RetroCatalogIconAnimated size={size} showAccent className="text-brand-retrocatalog" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-xs p-3">
        <div className="text-center">
          <p className="font-medium text-xs">Specs on RetroCatalog</p>
          <p className="text-xs opacity-70 mt-0.5">
            View device details on{' '}
            <a
              href={url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-retrocatalog transition-colors"
              onClick={(ev) => ev.stopPropagation()}
            >
              RetroCatalog
            </a>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
