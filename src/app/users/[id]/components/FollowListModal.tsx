'use client'

import { Users } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  LoadingSpinner,
  Pagination,
} from '@/components/ui'
import { api } from '@/lib/api'
import FollowListUserRow from './FollowListUserRow'

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
  const isHidden = query.data && 'hidden' in query.data && query.data.hidden

  const userIds =
    query.data && !isHidden
      ? query.data.items
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

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {query.isPending && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {isHidden && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">This list is private</p>
            </div>
          )}

          {query.data && !isHidden && query.data.items.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {props.type === 'followers' ? 'No followers yet' : 'Not following anyone'}
              </p>
            </div>
          )}

          {query.data && !isHidden && query.data.items.length > 0 && (
            <div className="space-y-1">
              {props.type === 'followers'
                ? followersQuery.data?.items.map((item) => (
                    <FollowListUserRow
                      key={item.id}
                      user={item.follower}
                      currentUserId={currentUserId}
                      isFollowing={followStatuses[item.follower.id]}
                    />
                  ))
                : followingQuery.data?.items.map((item) => (
                    <FollowListUserRow
                      key={item.id}
                      user={item.following}
                      currentUserId={currentUserId}
                      isFollowing={followStatuses[item.following.id]}
                    />
                  ))}
            </div>
          )}
        </div>

        {query.data && !isHidden && query.data.pagination.pages > 1 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              page={query.data.pagination.page}
              totalPages={query.data.pagination.pages}
              totalItems={query.data.pagination.total}
              itemsPerPage={query.data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default FollowListModal
