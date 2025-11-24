'use client'

import { ArrowUpRight, Download } from 'lucide-react'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import analytics from '@/lib/analytics'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

interface ButtonState {
  isHovered: boolean
}

function LiteAppButton(props: ButtonState) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={env.EMUREADY_LITE_GITHUB_URL}
          aria-label="Open the EmuReady App releases on GitHub"
          className="group relative inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-violet-500/15 px-4 py-2 text-left transition-all duration-200 hover:border-emerald-500/45 hover:shadow-lg hover:shadow-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-emerald-400/25 dark:from-emerald-400/15 dark:via-blue-400/10 dark:to-violet-400/15 dark:hover:border-emerald-400/45 dark:hover:shadow-emerald-400/15"
          onClick={() => {
            analytics.conversion.appDownloadClicked({
              appName: 'EmuReady Lite',
              platform: 'android',
              location: 'footer_lite_cta',
              url: env.EMUREADY_LITE_GITHUB_URL,
            })
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/20 via-blue-500/15 to-violet-500/20 opacity-0 transition-opacity duration-300 blur-lg group-hover:opacity-100" />
          <div
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform duration-300',
              props.isHovered
                ? 'scale-110 shadow-lg shadow-emerald-500/35 dark:shadow-emerald-400/30'
                : 'shadow-md shadow-emerald-500/20 dark:shadow-emerald-400/20',
            )}
          >
            <Download className="h-4 w-4" />
          </div>
          <div className="relative text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">EmuReady App</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">GitHub releases</p>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-center">
          <p className="font-medium mb-1">EmuReady App</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Browse the latest builds on GitHub.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function BetaAppButton(props: ButtonState) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={env.EMUREADY_BETA_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the EmuReady Beta app on Google Play"
          className="group relative inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/25 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15 px-4 py-2 text-left transition-all duration-200 hover:border-blue-500/45 hover:shadow-lg hover:shadow-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-blue-400/25 dark:from-blue-400/15 dark:via-indigo-400/10 dark:to-purple-400/15 dark:hover:border-blue-400/45 dark:hover:shadow-blue-400/15"
          onClick={() => {
            analytics.conversion.appDownloadClicked({
              appName: 'EmuReady Beta',
              platform: 'android',
              location: 'footer_beta_cta',
              url: env.EMUREADY_BETA_URL,
            })
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-indigo-500/15 to-purple-500/20 opacity-0 transition-opacity duration-300 blur-lg group-hover:opacity-100" />
          <div
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-transform duration-300',
              props.isHovered
                ? 'scale-110 shadow-lg shadow-blue-600/35 dark:shadow-blue-400/30'
                : 'shadow-md shadow-blue-600/20 dark:shadow-blue-400/20',
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="relative text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">EmuReady Beta App</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Google Play</p>
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-center">
          <p className="font-medium mb-1">EmuReady Beta</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Head to the Google Play Store to get the EmuReady Beta app with all the features
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function FooterAppLinks() {
  const [hoveredButton, setHoveredButton] = useState<'lite' | 'beta' | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <div
        onMouseEnter={() => setHoveredButton('beta')}
        onMouseLeave={() => setHoveredButton((current) => (current === 'beta' ? null : current))}
      >
        <BetaAppButton isHovered={hoveredButton === 'beta'} />
      </div>
      <div
        onMouseEnter={() => setHoveredButton('lite')}
        onMouseLeave={() => setHoveredButton((current) => (current === 'lite' ? null : current))}
      >
        <LiteAppButton isHovered={hoveredButton === 'lite'} />
      </div>
    </div>
  )
}
