'use client'

import { Badge, type BadgeSize } from '@/components/ui/Badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { hasActiveBans } from '@/utils/user-bans'

interface Props {
  author: unknown
  canView: boolean
  label?: string
  size?: BadgeSize
  className?: string
  tooltip?: string
}

export function BannedUserBadge(props: Props) {
  if (!props.canView) return null
  if (!hasActiveBans(props.author)) return null

  const badge = (
    <Badge variant="danger" size={props.size ?? 'sm'} className={props.className}>
      {props.label ?? 'BANNED USER'}
    </Badge>
  )

  if (!props.tooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger>{badge}</TooltipTrigger>
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  )
}
