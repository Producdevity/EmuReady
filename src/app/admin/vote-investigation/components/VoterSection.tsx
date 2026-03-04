'use client'

import {
  AlertTriangle,
  Ban,
  Eye,
  RotateCcw,
  Search,
  Shield,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
} from 'lucide-react'
import Link from 'next/link'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { ADMIN_ROUTES } from '@/app/admin/config/routes'
import { useAdminTable } from '@/app/admin/hooks/useAdminTable'
import { AdminTableContainer } from '@/components/admin'
import {
  Badge,
  Button,
  ColumnVisibilityControl,
  Input,
  LoadingSpinner,
  LocalizedDate,
  Pagination,
  SortableHeader,
  severityBadgeVariant,
  useConfirmDialog,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { formatCountLabel } from '@/utils/text'
import VoteStatCard from './VoteStatCard'

type UserSearchResult = RouterOutput['users']['searchUsers'][number]
type VoteSortField = 'createdAt' | 'value' | 'listingTitle'
type VoteTypeFilter = 'all' | 'up' | 'down'
type ListingTypeFilter = 'all' | 'handheld' | 'pc'

const VOTE_COLUMNS: ColumnDefinition[] = [
  { key: 'listing', label: 'Listing', defaultVisible: true, alwaysVisible: true },
  { key: 'type', label: 'Type', defaultVisible: true },
  { key: 'vote', label: 'Vote', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: true },
  { key: 'date', label: 'Date', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
]

function VoterSection() {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [voteTypeFilter, setVoteTypeFilter] = useState<VoteTypeFilter>('all')
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingTypeFilter>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const confirm = useConfirmDialog()

  const table = useAdminTable<VoteSortField>({
    defaultLimit: 25,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    enableUrlState: false,
  })

  const columnVisibility = useColumnVisibility(VOTE_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminVoteInvestigation,
  })

  const userSearchQuery = api.users.searchUsers.useQuery(
    { query: userSearch },
    { enabled: userSearch.length >= 2 && !selectedUser },
  )

  const patternsQuery = api.voteInvestigation.analyzePatterns.useQuery(
    { userId: selectedUser?.id ?? '' },
    { enabled: !!selectedUser },
  )

  const votesQuery = api.voteInvestigation.getUserVotes.useQuery(
    {
      userId: selectedUser?.id ?? '',
      page: table.page,
      limit: table.limit,
      sortField: table.sortField ?? 'createdAt',
      sortDirection: (table.sortDirection as 'asc' | 'desc') ?? 'desc',
      voteType: voteTypeFilter,
      listingType: listingTypeFilter,
      includeNullified: true,
    },
    { enabled: !!selectedUser },
  )

  const nullifyMutation = api.voteInvestigation.nullifyVotes.useMutation({
    onSuccess: (result) => {
      const total =
        result.handheldVotesNullified +
        result.pcVotesNullified +
        result.commentVotesNullified +
        result.pcCommentVotesNullified
      toast.success(
        `Nullified ${total} votes, recalculated ${result.listingsRecalculated} listings`,
      )
      void patternsQuery.refetch()
      void votesQuery.refetch()
    },
    onError: (err) => toast.error(`Failed to nullify votes: ${getErrorMessage(err)}`),
  })

  const restoreMutation = api.voteInvestigation.restoreVotes.useMutation({
    onSuccess: (result) => {
      const total =
        result.handheldVotesRestored +
        result.pcVotesRestored +
        result.commentVotesRestored +
        result.pcCommentVotesRestored
      toast.success(
        `Restored ${total} votes, recalculated ${formatCountLabel('report', result.listingsRecalculated)}`,
      )
      void patternsQuery.refetch()
      void votesQuery.refetch()
    },
    onError: (err) => toast.error(`Failed to restore votes: ${getErrorMessage(err)}`),
  })

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user)
    setUserSearch(user.name || user.email)
    setShowDropdown(false)
    table.setPage(1)
  }

  const handleNullify = async () => {
    if (!selectedUser || !patternsQuery.data) return
    const confirmed = await confirm({
      title: 'Nullify All Votes',
      description: `This will nullify ${patternsQuery.data.summary.totalVotes} active votes by ${selectedUser.name ?? 'this user'}, recalculate all affected listing scores, and reverse trust impacts. This action can be undone with "Restore Votes".`,
      confirmText: 'Nullify Votes',
    })
    if (!confirmed) return
    nullifyMutation.mutate({
      userId: selectedUser.id,
      reason: 'Vote manipulation investigation',
      includeCommentVotes: true,
    })
  }

  const handleRestore = async () => {
    if (!selectedUser) return
    const confirmed = await confirm({
      title: 'Restore Nullified Votes',
      description: `This will restore all previously nullified votes by ${selectedUser.name ?? 'this user'}, recalculate listing scores, and re-apply trust impacts.`,
      confirmText: 'Restore Votes',
    })
    if (!confirmed) return
    restoreMutation.mutate({
      userId: selectedUser.id,
      reason: 'Vote restoration after investigation',
    })
  }

  const handleVoteTypeChange = (value: VoteTypeFilter) => {
    setVoteTypeFilter(value)
    table.setPage(1)
  }

  const handleListingTypeChange = (value: ListingTypeFilter) => {
    setListingTypeFilter(value)
    table.setPage(1)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (userSearchQuery.data && userSearch.length >= 2 && !selectedUser) {
      setShowDropdown(true)
    }
  }, [userSearchQuery.data, userSearch, selectedUser])

  const handleChangeUserSearch = (ev: ChangeEvent<HTMLInputElement>) => {
    setUserSearch(ev.target.value)
    if (!selectedUser && ev.target.value.length >= 2) {
      setShowDropdown(true)
    } else if (ev.target.value.length < 2) {
      setShowDropdown(false)
    }
    if (selectedUser && ev.target.value !== (selectedUser.name || selectedUser.email)) {
      setSelectedUser(null)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Eye className="w-5 h-5" />
        Investigate User&apos;s Votes
      </h2>

      {/* User Search */}
      <div className="relative" ref={dropdownRef}>
        <Input
          type="text"
          value={userSearch}
          onChange={handleChangeUserSearch}
          placeholder="Search users by name or email..."
          leftIcon={<Search className="w-5 h-5" />}
        />
        {showDropdown && userSearchQuery.data && userSearchQuery.data.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {userSearchQuery.data.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelect(user)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                  </div>
                  <Badge>{user.role}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedUser.name || 'Unknown'}
              </span>
              <Badge className="ml-2">{selectedUser.role}</Badge>
            </div>
            <div className="flex gap-2">
              <Link href={`${ADMIN_ROUTES.USER_BANS}?userId=${selectedUser.id}`}>
                <Button size="sm" variant="outline" icon={Ban}>
                  Ban User
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedUser(null)
                  setUserSearch('')
                }}
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pattern Analysis */}
      {selectedUser && patternsQuery.isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {selectedUser && patternsQuery.data && (
        <div className="space-y-4">
          {/* Flags */}
          {patternsQuery.data.flags.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Suspicious Patterns Detected
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patternsQuery.data.flags.map((flag, i) => (
                  <Badge key={i} variant={severityBadgeVariant[flag.severity]} size="sm">
                    {flag.description}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VoteStatCard label="Total Votes" value={patternsQuery.data.summary.totalVotes} />
            <VoteStatCard
              label="Upvotes"
              value={patternsQuery.data.summary.upvotes}
              icon={<ThumbsUp className="w-4 h-4 text-green-500" />}
            />
            <VoteStatCard
              label="Downvotes"
              value={patternsQuery.data.summary.downvotes}
              icon={<ThumbsDown className="w-4 h-4 text-red-500" />}
            />
            <VoteStatCard
              label="Downvote %"
              value={`${patternsQuery.data.summary.downvotePercentage}%`}
              icon={<TrendingDown className="w-4 h-4 text-orange-500" />}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <VoteStatCard label="Last 24h" value={patternsQuery.data.summary.votesLast24h} />
            <VoteStatCard label="Last 7d" value={patternsQuery.data.summary.votesLast7d} />
            <VoteStatCard label="Avg/Day" value={patternsQuery.data.summary.averageVotesPerDay} />
          </div>

          {/* Targeted Authors */}
          {patternsQuery.data.targetedAuthors.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Targeted Authors</h3>
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Author
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Votes
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Downvotes
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Concentration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {patternsQuery.data.targetedAuthors.slice(0, 10).map((author) => (
                      <tr
                        key={author.authorId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {author.authorName ?? 'Unknown'}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {author.totalVotes}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={
                              author.downvotes > 0
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }
                          >
                            {author.downvotes}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {author.concentration}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {patternsQuery.data.summary.totalVotes > 0 && (
              <Button
                variant="danger"
                icon={Shield}
                onClick={handleNullify}
                isLoading={nullifyMutation.isPending}
                disabled={nullifyMutation.isPending || restoreMutation.isPending}
              >
                Nullify All Votes ({patternsQuery.data.summary.totalVotes})
              </Button>
            )}
            <Button
              variant="outline"
              icon={RotateCcw}
              onClick={handleRestore}
              isLoading={restoreMutation.isPending}
              disabled={nullifyMutation.isPending || restoreMutation.isPending}
            >
              Restore Nullified Votes
            </Button>
          </div>
        </div>
      )}

      {/* Vote Table */}
      {selectedUser && votesQuery.data && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Vote History ({votesQuery.data.pagination.total})
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={voteTypeFilter}
                onChange={(ev) => handleVoteTypeChange(ev.target.value as VoteTypeFilter)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Votes</option>
                <option value="up">Upvotes</option>
                <option value="down">Downvotes</option>
              </select>
              <select
                value={listingTypeFilter}
                onChange={(ev) => handleListingTypeChange(ev.target.value as ListingTypeFilter)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="handheld">Handheld</option>
                <option value="pc">PC</option>
              </select>
              <ColumnVisibilityControl columns={VOTE_COLUMNS} columnVisibility={columnVisibility} />
            </div>
          </div>

          <AdminTableContainer>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columnVisibility.isColumnVisible('listing') && (
                    <SortableHeader
                      label="Listing"
                      field="listingTitle"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-4 py-2 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('type') && (
                    <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                      Type
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('vote') && (
                    <SortableHeader
                      label="Vote"
                      field="value"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-4 py-2 text-center"
                    />
                  )}
                  {columnVisibility.isColumnVisible('author') && (
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Author
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('date') && (
                    <SortableHeader
                      label="Date"
                      field="createdAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-4 py-2 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('status') && (
                    <th className="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {votesQuery.data.items.map((vote) => (
                  <tr
                    key={vote.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${vote.nullifiedAt ? 'opacity-50' : ''}`}
                  >
                    {columnVisibility.isColumnVisible('listing') && (
                      <td className="px-4 py-2 text-gray-900 dark:text-white max-w-[200px] truncate">
                        {vote.listingTitle}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('type') && (
                      <td className="px-4 py-2 text-center">
                        <Badge variant={vote.type === 'handheld' ? 'default' : 'info'}>
                          {vote.type}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('vote') && (
                      <td className="px-4 py-2 text-center">
                        {vote.value ? (
                          <ThumbsUp className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('author') && (
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        {vote.authorName ?? 'Unknown'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('date') && (
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        <LocalizedDate date={vote.createdAt} format="dateTime" />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <td className="px-4 py-2 text-center">
                        {vote.nullifiedAt ? (
                          <Badge variant="danger">Nullified</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableContainer>
          {votesQuery.data.pagination.pages > 1 && (
            <div className="mt-4">
              <Pagination
                page={table.page}
                totalPages={votesQuery.data.pagination.pages}
                onPageChange={table.setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VoterSection
