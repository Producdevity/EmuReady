'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'

const patreonUrl = process.env.NEXT_PUBLIC_PATREON_LINK || 'https://www.patreon.com/Producdevity'

export function FooterPatreonButton() {
  const [isHovered, setIsHovered] = useState(false)
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={patreonUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support us on Patreon"
          className="group relative inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-br from-foreground/5 to-foreground/10 dark:from-foreground/15 dark:to-foreground/5 border border-foreground/15 dark:border-foreground/20 hover:border-foreground/30 dark:hover:border-foreground/35 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-foreground/10 dark:hover:shadow-foreground/10 flex-shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            analytics.contentDiscovery.externalLinkClicked({
              url: patreonUrl,
              context: 'footer_patreon_button',
            })
          }}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

          {/* Patreon symbol (auto-switch for light/dark via theme) */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            {mounted && (
              <Image
                src={
                  resolvedTheme === 'dark'
                    ? '/assets/patreon/PATREON_SYMBOLWHITE_RGB.svg'
                    : '/assets/patreon/PATREON_SYMBOLBLACK_RGB.svg'
                }
                alt="Patreon"
                width={18}
                height={18}
                style={{ width: '18px', height: '18px' }}
                className={cn(
                  'transition-all duration-300 opacity-95',
                  isHovered ? 'scale-110 brightness-110' : '',
                )}
                unoptimized
                priority={false}
              />
            )}
            {/* Avoid hydration mismatch; render nothing until mounted */}
          </div>

          {/* Accent pulse */}
          <div className="absolute -top-1 -right-1 w-2 h-2">
            <div
              className={cn(
                'w-full h-full rounded-full transition-all duration-300 bg-[rgb(var(--brand-patreon))]',
                isHovered ? 'animate-ping' : 'animate-pulse',
              )}
            />
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-center">
          <p className="font-medium mb-1">Support EmuReady on Patreon</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Help keep the servers running and development active
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
