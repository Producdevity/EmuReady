'use client'

import {
  UserCheck,
  Users,
  Shield,
  Crown,
  Star,
  Award,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import {
  getTrustLevel,
  getNextTrustLevel,
  getProgressToNextLevel,
} from '@/lib/trust/config'
import { cn } from '@/lib/utils'

interface Props {
  trustScore: number
  showProgress?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const TRUST_LEVEL_ICONS: Record<string, LucideIcon> = {
  New: Users,
  Contributor: UserCheck,
  Trusted: Shield,
  Verified: Award,
  Elite: Crown,
  Core: Star,
}

const TRUST_LEVEL_COLORS: Record<
  string,
  'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
> = {
  New: 'default',
  Contributor: 'primary',
  Trusted: 'success',
  Verified: 'info',
  Elite: 'warning',
  Core: 'danger',
}

function TrustLevelBadge(props: Props) {
  const trustLevel = getTrustLevel(props.trustScore)
  const nextLevel = getNextTrustLevel(props.trustScore)
  const progress = getProgressToNextLevel(props.trustScore)

  const Icon = TRUST_LEVEL_ICONS[trustLevel.name] || Users
  const color = TRUST_LEVEL_COLORS[trustLevel.name] || 'default'

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

  const size = props.size ?? 'md'

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <Badge
        variant={color}
        className={cn('flex items-center gap-1.5 w-fit', sizeClasses[size])}
      >
        <Icon className={iconSizes[size]} />
        <span className="font-medium">{trustLevel.name}</span>
      </Badge>

      {props.showProgress && nextLevel && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
            <span>Progress to {nextLevel.name}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {nextLevel.minScore - props.trustScore} points needed
          </div>
        </div>
      )}
    </div>
  )
}

export default TrustLevelBadge
