'use client'

import { UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { ConnectionUserRow } from '@/app/profile/components/connections/ConnectionUserRow'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import type { RouterOutput } from '@/types/trpc'

type FollowUser = Extract<
  RouterOutput['social']['getFollowers'],
  { visibility: 'visible' }
>['items'][number]['follower']

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

  const followAction =
    isAuthenticated && !isOwnProfile ? (
      isFollowing ? (
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
      )
    ) : undefined

  return <ConnectionUserRow user={props.user} action={followAction} />
}

export default FollowListUserRow
