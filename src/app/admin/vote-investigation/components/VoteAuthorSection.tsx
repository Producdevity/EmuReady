'use client'

import { Search, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Input, LoadingSpinner, Pagination } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'

type UserSearchResult = RouterOutput['users']['searchUsers'][number]

function VoteAuthorSection() {
  const [selectedAuthor, setSelectedAuthor] = useState<UserSearchResult | null>(null)
  const [authorSearch, setAuthorSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [page, setPage] = useState(1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const authorSearchQuery = api.users.searchUsers.useQuery(
    { query: authorSearch },
    { enabled: authorSearch.length >= 2 && !selectedAuthor },
  )

  const votesOnAuthorQuery = api.voteInvestigation.getVotesOnAuthorListings.useQuery(
    { authorId: selectedAuthor?.id ?? '', page, limit: 25 },
    { enabled: !!selectedAuthor },
  )

  const handleAuthorSelect = (user: UserSearchResult) => {
    setSelectedAuthor(user)
    setAuthorSearch(user.name || user.email)
    setShowDropdown(false)
    setPage(1)
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
    if (authorSearchQuery.data && authorSearch.length >= 2 && !selectedAuthor) {
      setShowDropdown(true)
    }
  }, [authorSearchQuery.data, authorSearch, selectedAuthor])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Investigate Votes on Author&apos;s Listings
      </h2>

      {/* Author Search */}
      <div className="relative" ref={dropdownRef}>
        <Input
          type="text"
          value={authorSearch}
          onChange={(ev) => {
            setAuthorSearch(ev.target.value)
            if (!selectedAuthor && ev.target.value.length >= 2) {
              setShowDropdown(true)
            } else if (ev.target.value.length < 2) {
              setShowDropdown(false)
            }
            if (
              selectedAuthor &&
              ev.target.value !== (selectedAuthor.name || selectedAuthor.email)
            ) {
              setSelectedAuthor(null)
            }
          }}
          placeholder="Search for the targeted author..."
          leftIcon={<Search className="w-5 h-5" />}
        />
        {showDropdown && authorSearchQuery.data && authorSearchQuery.data.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {authorSearchQuery.data.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleAuthorSelect(user)}
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

        {selectedAuthor && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedAuthor.name || 'Unknown'}
              </span>
              <Badge className="ml-2">{selectedAuthor.role}</Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedAuthor(null)
                setAuthorSearch('')
              }}
            >
              Change
            </Button>
          </div>
        )}
      </div>

      {/* Voters on Author Table */}
      {selectedAuthor && votesOnAuthorQuery.isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {selectedAuthor && votesOnAuthorQuery.data && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Voters on {selectedAuthor.name}&apos;s Listings
          </h3>
          {votesOnAuthorQuery.data.items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-4">
              No votes found on this author&apos;s listings.
            </p>
          ) : (
            <>
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Voter
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Total
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Upvotes
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                        Downvotes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {votesOnAuthorQuery.data.items.map((voter) => (
                      <tr
                        key={voter.voterId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {voter.voterName ?? 'Unknown'}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {voter.totalVotes}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">
                          {voter.upvotes}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={
                              voter.downvotes > 0
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }
                          >
                            {voter.downvotes}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {votesOnAuthorQuery.data.pagination.pages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={votesOnAuthorQuery.data.pagination.pages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default VoteAuthorSection
