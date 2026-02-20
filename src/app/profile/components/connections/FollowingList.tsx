'use client'

import { UserMinus } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { SocialConnectionList } from './SocialConnectionList'

interface Props {
  userId: string
  page: number
  limit: number
  search: string
  onPageChange: (page: number) => void
}

function FollowingList(props: Props) {
  const utils = api.useUtils()
  const query = api.social.getFollowing.useQuery({
    userId: props.userId,
    page: props.page,
    limit: props.limit,
    search: props.search || undefined,
  })

  const unfollowMutation = api.social.unfollow.useMutation({
    onSuccess: () => {
      toast.success('Unfollowed successfully')
      utils.social.getFollowing.invalidate({ userId: props.userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.userId }).catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  return (
    <SocialConnectionList
      items={query.data?.items.map((item) => ({ id: item.id, user: item.following }))}
      isPending={query.isPending}
      pagination={query.data?.pagination}
      onPageChange={props.onPageChange}
      emptyMessage="Not following anyone"
      renderAction={(user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => unfollowMutation.mutate({ userId: user.id })}
          disabled={unfollowMutation.isPending}
          icon={UserMinus}
        >
          Unfollow
        </Button>
      )}
    />
  )
}

export default FollowingList
