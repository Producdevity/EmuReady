'use client'

import { Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'

interface Props {
  href: string
  className?: string
}

export default function ApprovalCountBadge(props: Props) {
  const userQuery = api.users.me.useQuery()

  const canViewStats = hasPermission(
    userQuery.data?.permissions,
    PERMISSIONS.VIEW_STATISTICS,
  )

  const gameStatsQuery = api.games.getStats.useQuery(undefined, {
    enabled: canViewStats && props.href === '/admin/games/approvals',
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const listingStatsQuery = api.listings.getStats.useQuery(undefined, {
    enabled: canViewStats && props.href === '/admin/approvals',
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const pcListingStatsQuery = api.pcListings.stats.useQuery(undefined, {
    enabled: canViewStats && props.href === '/admin/pc-listing-approvals',
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const statsMap = {
    '/admin/games/approvals': gameStatsQuery,
    '/admin/approvals': listingStatsQuery,
    '/admin/pc-listing-approvals': pcListingStatsQuery,
  } as const

  const count = statsMap[props.href as keyof typeof statsMap]?.data?.pending

  if (typeof count !== 'number' || count <= 0) return null

  return (
    <Badge
      variant="danger"
      size="sm"
      pill
      className={cn(
        'absolute top-2 right-2 transition-all duration-300 ease-in-out',
        props.className,
      )}
    >
      {count}
    </Badge>
  )
}
