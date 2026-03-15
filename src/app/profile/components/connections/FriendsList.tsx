'use client'

import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { ConnectionUserRow } from './ConnectionUserRow'
import { SocialConnectionList } from './SocialConnectionList'

interface Props {
  userId: string
  page: number
  limit: number
  search: string
  onPageChange: (page: number) => void
}

function FriendsList(props: Props) {
  const utils = api.useUtils()
  const query = api.social.getFriends.useQuery({
    userId: props.userId,
    page: props.page,
    limit: props.limit,
    search: props.search || undefined,
  })

  const pendingQuery = api.social.getFriendRequests.useQuery({
    direction: 'received',
    page: 1,
    limit: 10,
  })

  const respondMutation = api.social.respondFriendRequest.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.accept ? 'Friend request accepted' : 'Friend request declined')
      utils.social.getFriends.invalidate({ userId: props.userId }).catch(console.error)
      utils.social.getFriendRequests.invalidate().catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const hasPending = pendingQuery.data && pendingQuery.data.items.length > 0

  const pendingRequestsHeader = hasPending ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
        Pending Friend Requests ({pendingQuery.data.items.length})
      </h4>
      <div className="space-y-1">
        {pendingQuery.data.items.map((item) => (
          <ConnectionUserRow
            key={item.id}
            user={item.sender}
            action={
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => respondMutation.mutate({ requestId: item.id, accept: true })}
                  disabled={respondMutation.isPending}
                  icon={Check}
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => respondMutation.mutate({ requestId: item.id, accept: false })}
                  disabled={respondMutation.isPending}
                  icon={X}
                >
                  Decline
                </Button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  ) : null

  return (
    <SocialConnectionList
      items={query.data?.items.map((item) => ({
        id: item.id,
        user: item.sender.id === props.userId ? item.receiver : item.sender,
      }))}
      isPending={query.isPending}
      pagination={query.data?.pagination}
      onPageChange={props.onPageChange}
      emptyMessage="No friends yet"
      renderAction={() => null}
      header={pendingRequestsHeader}
    />
  )
}

export default FriendsList
