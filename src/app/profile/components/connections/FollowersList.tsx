'use client'

import { skipToken } from '@tanstack/react-query'
import { UserMinus } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { SocialConnectionList } from './SocialConnectionList'

interface Props {
  variant: 'followers' | 'following'
  userId: string
  page: number
  limit: number
  search: string
  onPageChange: (page: number) => void
}

const CONFIG = {
  followers: {
    successMessage: 'Follower removed',
    emptyMessage: 'No followers yet',
    buttonLabel: 'Remove',
  },
  following: {
    successMessage: 'Unfollowed successfully',
    emptyMessage: 'Not following anyone',
    buttonLabel: 'Unfollow',
  },
} as const

function FollowConnectionList(props: Props) {
  const utils = api.useUtils()
  const queryInput = {
    userId: props.userId,
    page: props.page,
    limit: props.limit,
    search: props.search || undefined,
  }

  const followersQuery = api.social.getFollowers.useQuery(
    props.variant === 'followers' ? queryInput : skipToken,
  )
  const followingQuery = api.social.getFollowing.useQuery(
    props.variant === 'following' ? queryInput : skipToken,
  )

  const config = CONFIG[props.variant]

  const removeFollowerMutation = api.social.removeFollower.useMutation({
    onSuccess: () => {
      toast.success(config.successMessage)
      utils.social.getFollowers.invalidate({ userId: props.userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.userId }).catch(console.error)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const unfollowMutation = api.social.unfollow.useMutation({
    onSuccess: () => {
      toast.success(config.successMessage)
      utils.social.getFollowing.invalidate({ userId: props.userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.userId }).catch(console.error)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const mutation = props.variant === 'followers' ? removeFollowerMutation : unfollowMutation

  const followersData = followersQuery.data
  const followingData = followingQuery.data

  const items =
    props.variant === 'followers' && followersData?.visibility === 'visible'
      ? followersData.items.map((item) => ({ id: item.id, user: item.follower }))
      : props.variant === 'following' && followingData?.visibility === 'visible'
        ? followingData.items.map((item) => ({ id: item.id, user: item.following }))
        : undefined

  const query = props.variant === 'followers' ? followersQuery : followingQuery
  const data = query.data

  return (
    <SocialConnectionList
      items={items}
      isPending={query.isPending}
      pagination={data?.visibility === 'visible' ? data.pagination : undefined}
      onPageChange={props.onPageChange}
      emptyMessage={config.emptyMessage}
      renderAction={(user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutation.mutate({ userId: user.id })}
          disabled={mutation.isPending}
          icon={UserMinus}
        >
          {config.buttonLabel}
        </Button>
      )}
    />
  )
}

export default FollowConnectionList
