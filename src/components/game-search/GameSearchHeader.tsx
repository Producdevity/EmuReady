'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Gamepad2, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ComponentType } from 'react'
import { Button, Badge } from '@/components/ui'
import type { GameProvider } from './types'

interface Props {
  provider: GameProvider
  showBackButton?: boolean
  showAlternativeSearch?: boolean
  isAdmin?: boolean
}

interface GameProviderConfig {
  title: string
  badge: string
  badgeIcon: ComponentType<{ className?: string }>
  description: string
  alternativeProvider?: { label: string; path: string }
}

const providerConfig: Record<GameProvider, GameProviderConfig> = {
  igdb: {
    title: 'Search Game Database',
    badge: 'Powered by IGDB',
    badgeIcon: Sparkles,
    description:
      'Search IGDB for comprehensive game information with better metadata, multiple images, and accurate NSFW detection',
    alternativeProvider: { label: 'Use Classic Search (TGDB)', path: '/games/new/search' },
  },
  tgdb: {
    title: 'Search Game Database',
    badge: 'Powered by TheGamesDB',
    badgeIcon: Gamepad2,
    description: 'Search TheGamesDB for community-sourced game information and artwork',
    alternativeProvider: { label: 'Use IGDB Search', path: '/games/new/search/v2' },
  },
  rawg: {
    title: 'Search Game Database',
    badge: 'Powered by RAWG',
    badgeIcon: Globe,
    description: "Search RAWG's extensive video game database with modern game coverage",
    alternativeProvider: { label: 'Use IGDB Search', path: '/games/new/search/v2' },
  },
}

export function GameSearchHeader(props: Props) {
  const router = useRouter()
  const config = providerConfig[props.provider]
  const BadgeIcon = config.badgeIcon

  return (
    <div className="mb-8">
      {props.isAdmin && (
        <div className="flex items-center justify-between mb-6">
          {props.showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                onClick={() => router.push('/games/new')}
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Manual Entry
              </Button>
            </motion.div>
          )}
          {props.showAlternativeSearch && config.alternativeProvider && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                onClick={() => router.push(config.alternativeProvider!.path)}
                variant="outline"
                size="sm"
                className="text-slate-600 dark:text-slate-400"
              >
                {config.alternativeProvider.label}
              </Button>
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{config.title}</h1>
          <Badge variant="success" className="flex items-center gap-1">
            <BadgeIcon className="h-3 w-3" />
            {config.badge}
          </Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400">{config.description}</p>
      </motion.div>
    </div>
  )
}
