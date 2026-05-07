'use client'

import { Badge, type BadgeSize } from '@/components/ui/Badge'
import { PlatformScope } from '@orm'

interface Props {
  name: string
  scope: PlatformScope
  size?: BadgeSize
  title?: string
}

const SCOPE_VARIANT: Record<PlatformScope, 'info' | 'success' | 'primary'> = {
  [PlatformScope.DESKTOP]: 'info',
  [PlatformScope.MOBILE]: 'success',
  [PlatformScope.UNIVERSAL]: 'primary',
}

export function PlatformBadge(props: Props) {
  return (
    <Badge variant={SCOPE_VARIANT[props.scope]} size={props.size ?? 'sm'} pill>
      <span title={props.title ?? props.name}>{props.name}</span>
    </Badge>
  )
}
