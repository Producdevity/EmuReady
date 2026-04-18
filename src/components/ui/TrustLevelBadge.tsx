'use client'

import { UserCheck, Users, Shield, Crown, Star, Award, type LucideIcon } from 'lucide-react'
import { type JSX } from 'react'
import { Badge } from '@/components/ui'
import {
  getTrustLevel,
  getNextTrustLevel,
  getProgressToNextLevel,
  type TrustLevel,
} from '@/lib/trust/config'
import { cn } from '@/lib/utils'

type TrustLevelName = TrustLevel['name']

const TRUST_LEVEL_ICONS: Record<TrustLevelName, LucideIcon> = {
  Newcomer: Users,
  Contributor: UserCheck,
  Trusted: Shield,
  Verified: Award,
  Elite: Crown,
  Core: Star,
}

const TRUST_LEVEL_COLORS: Record<
  TrustLevelName,
  'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
> = {
  Newcomer: 'default',
  Contributor: 'primary',
  Trusted: 'success',
  Verified: 'info',
  Elite: 'warning',
  Core: 'danger',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

interface Props {
  trustScore?: number
  showProgress?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TrustLevelBadge(props: Props): JSX.Element {
  const trustScore = props.trustScore ?? 0
  const trustLevel = getTrustLevel(trustScore)
  const nextLevel = getNextTrustLevel(trustScore)
  const progress = getProgressToNextLevel(trustScore)

  const levelName = trustLevel.name
  const Icon = TRUST_LEVEL_ICONS[levelName]
  const color = TRUST_LEVEL_COLORS[levelName]
  const size = props.size ?? 'md'

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <Badge variant={color} className={cn('flex items-center gap-1.5 w-fit', sizeClasses[size])}>
        <Icon className={iconSizes[size]} />
        <span className="font-medium">{levelName}</span>
      </Badge>

      {props.showProgress && nextLevel && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
            <span>Progress to {nextLevel.name}</span>
            <span>{Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {nextLevel.minScore - trustScore} points needed
          </div>
        </div>
      )}
    </div>
  )
}
