import Image from 'next/image'
import Link from 'next/link'
import { type SocialUser } from '@/app/profile/components/connections/SocialConnectionList'
import { Badge, TrustLevelBadge } from '@/components/ui'
import { getRoleVariant } from '@/utils/badge-colors'
import { formatUserRole } from '@/utils/format'
import type { ReactNode } from 'react'

interface Props {
  user: SocialUser
  action?: ReactNode
}

export function ConnectionUserRow(props: Props) {
  return (
    <div className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <Link href={`/users/${props.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
          <Image
            src={props.user.profileImage ?? '/placeholder/profile.svg'}
            alt={props.user.name ?? 'User'}
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {props.user.name ?? 'Anonymous'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={getRoleVariant(props.user.role)} size="sm">
              {formatUserRole(props.user.role)}
            </Badge>
            <TrustLevelBadge trustScore={props.user.trustScore} size="sm" />
          </div>
        </div>
      </Link>
      {props.action && <div className="flex-shrink-0">{props.action}</div>}
    </div>
  )
}
