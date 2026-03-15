'use client'

import { Users } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { api } from '@/lib/api'
import FollowListUserRow from './FollowListUserRow'
import ModalListContent from './ModalListContent'

type ListType = 'followers' | 'following'

interface Props {
  userId: string
  type: ListType
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FollowListModal(props: Props) {
  const [page, setPage] = useState(1)
  const limit = 20

  const currentUserQuery = api.users.me.useQuery()
  const currentUserId = currentUserQuery.data?.id

  const followersQuery = api.social.getFollowers.useQuery(
    { userId: props.userId, page, limit },
    { enabled: props.open && props.type === 'followers' },
  )

  const followingQuery = api.social.getFollowing.useQuery(
    { userId: props.userId, page, limit },
    { enabled: props.open && props.type === 'following' },
  )

  const query = props.type === 'followers' ? followersQuery : followingQuery
  const data = query.data

  const userIds =
    data?.visibility === 'visible'
      ? data.items
          .map((item) => {
            if ('follower' in item) return item.follower.id
            if ('following' in item) return item.following.id
            return null
          })
          .filter((id): id is string => id !== null && id !== currentUserId)
      : []

  const bulkFollowQuery = api.social.getBulkFollowStatuses.useQuery(
    { userIds },
    { enabled: Boolean(currentUserId) && userIds.length > 0 },
  )

  const followStatuses = bulkFollowQuery.data?.statuses ?? {}

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{props.type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
        </DialogHeader>

        <ModalListContent
          isPending={query.isPending}
          error={query.error}
          visibility={data?.visibility}
          itemCount={data?.visibility === 'visible' ? data.items.length : 0}
          icon={Users}
          emptyMessage={props.type === 'followers' ? 'No followers yet' : 'Not following anyone'}
          pagination={
            data?.visibility === 'visible'
              ? { ...data.pagination, onPageChange: setPage }
              : undefined
          }
        >
          {props.type === 'followers'
            ? followersQuery.data?.visibility === 'visible' &&
              followersQuery.data.items.map((item) => (
                <FollowListUserRow
                  key={item.id}
                  user={item.follower}
                  currentUserId={currentUserId}
                  isFollowing={followStatuses[item.follower.id]}
                />
              ))
            : followingQuery.data?.visibility === 'visible' &&
              followingQuery.data.items.map((item) => (
                <FollowListUserRow
                  key={item.id}
                  user={item.following}
                  currentUserId={currentUserId}
                  isFollowing={followStatuses[item.following.id]}
                />
              ))}
        </ModalListContent>
      </DialogContent>
    </Dialog>
  )
}

export default FollowListModal
