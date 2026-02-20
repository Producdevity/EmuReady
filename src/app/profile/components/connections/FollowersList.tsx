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

function FollowersList(props: Props) {
  const utils = api.useUtils()
  const query = api.social.getFollowers.useQuery({
    userId: props.userId,
    page: props.page,
    limit: props.limit,
    search: props.search || undefined,
  })

  const removeFollowerMutation = api.social.removeFollower.useMutation({
    onSuccess: () => {
      toast.success('Follower removed')
      utils.social.getFollowers.invalidate({ userId: props.userId }).catch(console.error)
      utils.social.getFollowCounts.invalidate({ userId: props.userId }).catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  return (
    <SocialConnectionList
      items={query.data?.items.map((item) => ({ id: item.id, user: item.follower }))}
      isPending={query.isPending}
      pagination={query.data?.pagination}
      onPageChange={props.onPageChange}
      emptyMessage="No followers yet"
      renderAction={(user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeFollowerMutation.mutate({ userId: user.id })}
          disabled={removeFollowerMutation.isPending}
          icon={UserMinus}
        >
          Remove
        </Button>
      )}
    />
  )
}

export default FollowersList
