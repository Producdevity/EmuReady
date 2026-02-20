'use client'

import { UserMinus, UserPlus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Badge, Button, TrustLevelBadge } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { getRoleVariant } from '@/utils/badge-colors'
import { formatUserRole } from '@/utils/format'
import getErrorMessage from '@/utils/getErrorMessage'
import type { RouterOutput } from '@/types/trpc'

type FollowUser = RouterOutput['social']['getFollowers']['items'][number]['follower']

interface Props {
  user: FollowUser
  currentUserId?: string
  isFollowing?: boolean
}

function FollowListUserRow(props: Props) {
  const isOwnProfile = props.currentUserId === props.user.id
  const isAuthenticated = Boolean(props.currentUserId)
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)

  const isFollowing = optimisticFollowing ?? props.isFollowing

  const utils = api.useUtils()
  const followMutation = api.social.follow.useMutation({
    onMutate: () => setOptimisticFollowing(true),
    onError: (error) => {
      setOptimisticFollowing(null)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      setOptimisticFollowing(null)
      utils.social.getBulkFollowStatuses.invalidate().catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.user.id }).catch(console.error)
    },
  })
  const unfollowMutation = api.social.unfollow.useMutation({
    onMutate: () => setOptimisticFollowing(false),
    onError: (error) => {
      setOptimisticFollowing(null)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      setOptimisticFollowing(null)
      utils.social.getBulkFollowStatuses.invalidate().catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.user.id }).catch(console.error)
    },
  })

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <Link href={`/users/${props.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
          <Image
            src={props.user.profileImage ?? '/placeholder/profile.svg'}
            alt={props.user.name ?? 'User'}
            width={36}
            height={36}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {props.user.name ?? 'Anonymous'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant={getRoleVariant(props.user.role)} size="sm">
              {formatUserRole(props.user.role)}
            </Badge>
            <TrustLevelBadge trustScore={props.user.trustScore} size="sm" />
          </div>
        </div>
      </Link>
      {isAuthenticated && !isOwnProfile && (
        <div className="flex-shrink-0">
          {isFollowing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unfollowMutation.mutate({ userId: props.user.id })}
              disabled={unfollowMutation.isPending}
              icon={UserMinus}
            >
              Unfollow
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => followMutation.mutate({ userId: props.user.id })}
              disabled={followMutation.isPending}
              icon={UserPlus}
            >
              Follow
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default FollowListUserRow
