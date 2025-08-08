'use client'

import Link from 'next/link'
import { AuthorDisplay } from '@/components/listings/AuthorDisplay'
import {
  Badge,
  PerformanceBadge,
  EditButton,
  ViewButton,
} from '@/components/ui'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role, ApprovalStatus } from '@orm'
import type { RouterOutput } from '@/types/trpc'

type Game = NonNullable<RouterOutput['games']['byId']>

interface Props {
  pcListings: Game['pcListings']
  gameId: Game['id']
  hasPermission: boolean
  userRole?: Role | null
}

export function GamePcListingsSection(props: Props) {
  const canSeeBannedUsers = roleIncludesRole(props.userRole, Role.MODERATOR)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        PC Listings <Badge>{props.pcListings?.length || 0}</Badge>
      </h2>

      {props.pcListings && props.pcListings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {props.pcListings.map((listing) => (
                <tr
                  key={listing.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PerformanceBadge
                        rank={listing.performance.rank}
                        label={listing.performance.label}
                        description={listing.performance?.description}
                      />
                      {canSeeBannedUsers &&
                        'status' in listing &&
                        listing.status !== ApprovalStatus.APPROVED && (
                          <Badge
                            variant={
                              listing.status === ApprovalStatus.REJECTED
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {listing.status}
                          </Badge>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AuthorDisplay
                      author={listing.author}
                      canSeeBannedUsers={canSeeBannedUsers}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge>{listing._count.comments || 0}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {props.hasPermission && (
                        <EditButton
                          href={`/admin/pc-listings/${listing.id}/edit`}
                          title="Edit PC Listing"
                        />
                      )}
                      <ViewButton
                        href={`/pc-listings/${listing.id}`}
                        title="View Details"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No PC listings yet for this game.
          </p>
          <Link
            href={`/pc-listings/new?gameId=${props.gameId}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
          >
            Be the first to add a PC listing
          </Link>
        </div>
      )}
    </div>
  )
}
