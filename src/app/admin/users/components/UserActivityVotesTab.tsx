'use client'

import { Search, ThumbsDown, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { Input, Pagination } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import UserActivityVoteAnalysis from './UserActivityVoteAnalysis'

type UserData = NonNullable<RouterOutput['users']['getUserById']>

interface Props {
  votes: UserData['votes']
  totalCount: number
  userId: string
  page: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (search: string) => void
  isFetching: boolean
  isModerator: boolean
}

function UserActivityVotesTab(props: Props) {
  const hasFilters = !!props.search

  return (
    <div className={cn('space-y-3', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Vote Pattern Analysis */}
      {props.isModerator && (
        <>
          <UserActivityVoteAnalysis userId={props.userId} />
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search votes by game, device, or emulator..."
            value={props.search}
            onChange={(ev) => props.onSearchChange(ev.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {hasFilters ? (
          <span>
            {props.votes.pagination.total} of {props.totalCount} votes
          </span>
        ) : (
          <span>{props.totalCount} votes</span>
        )}
      </div>

      {/* Vote Rows */}
      {props.votes.items.length > 0 ? (
        <div className="space-y-1">
          {props.votes.items.map((vote) => (
            <Link
              key={vote.id}
              href={`/listings/${vote.listing.id}`}
              className="flex items-center justify-between p-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {vote.value ? (
                  <ThumbsUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <ThumbsDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                )}
                <span className="truncate text-gray-900 dark:text-white">
                  {vote.listing.game.title}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0 text-gray-500 dark:text-gray-400">
                <span>
                  {vote.listing.device.brand.name} {vote.listing.device.modelName}
                </span>
                <span>{vote.listing.emulator.name}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
          {hasFilters ? 'No votes match your search' : 'No votes cast yet'}
        </p>
      )}

      {/* Pagination */}
      {props.votes.pagination.pages > 1 && (
        <Pagination
          page={props.page}
          totalPages={props.votes.pagination.pages}
          totalItems={props.votes.pagination.total}
          itemsPerPage={props.votes.pagination.limit}
          onPageChange={props.onPageChange}
        />
      )}
    </div>
  )
}

export default UserActivityVotesTab
