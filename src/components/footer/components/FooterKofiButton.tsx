'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'

const kofiUrl = process.env.NEXT_PUBLIC_KOFI_LINK || 'https://ko-fi.com/producdevity'

export function FooterKofiButton() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={kofiUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support us on Ko-fi"
          className="group relative inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-br from-[#ff5e5b]/10 to-[#ff8e53]/10 dark:from-[#ff5e5b]/20 dark:to-[#ff8e53]/20 border border-[#ff5e5b]/20 dark:border-[#ff5e5b]/30 hover:border-[#ff5e5b]/40 dark:hover:border-[#ff5e5b]/50 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#ff5e5b]/20 dark:hover:shadow-[#ff5e5b]/10 flex-shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            analytics.contentDiscovery.externalLinkClicked({
              url: kofiUrl,
              context: 'footer_kofi_button',
            })
          }}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#ff5e5b]/20 to-[#ff8e53]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

          {/* Ko-fi symbol */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Image
              src="/assets/kofi/kofi_symbol.svg"
              alt="Ko-fi"
              width={20}
              height={20}
              style={{ width: '20px', height: '20px' }}
              className={cn(
                'transition-all duration-300',
                isHovered ? 'scale-110 brightness-110' : '',
              )}
              unoptimized
            />
          </div>

          {/* Animated heart pulse */}
          <div className="absolute -top-1 -right-1 w-2 h-2">
            <div
              className={cn(
                'w-full h-full bg-red-500 rounded-full transition-all duration-300',
                isHovered ? 'animate-ping' : 'animate-pulse',
              )}
            />
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-center">
          <p className="font-medium mb-1">Support EmuReady ☕</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Help keep the servers running and development active
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
