'use client'

import {
  PerformanceBadge,
  ApprovalStatusBadge,
  EditButton,
  ViewButton,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'

type Game = NonNullable<RouterOutput['games']['byId']>

interface Props {
  game: Game
}

export function GameRelatedData(props: Props) {
  const userQuery = api.users.me.useQuery()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Related Compatibility Reports ({props.game.listings.length})
      </h2>

      {props.game.listings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No Compatibility Reports for this game yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Emulator
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {props.game.listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {listing.device.brand.name} {listing.device.modelName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{listing.emulator.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <PerformanceBadge
                      rank={listing.performance.rank}
                      label={listing.performance.label}
                      description={listing.performance.description}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {listing.author?.name ?? 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ApprovalStatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <LocalizedDate date={listing.createdAt} format="timeAgo" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {hasPermission(userQuery.data?.permissions, PERMISSIONS.EDIT_ANY_LISTING) && (
                      <EditButton
                        href={`/admin/listings/${listing.id}/edit`}
                        title="Edit Compatibility Report"
                      />
                    )}
                    <ViewButton href={`/listings/${listing.id}`} title="View Details" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
