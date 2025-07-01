'use client'

import {
  PerformanceBadge,
  ApprovalStatusBadge,
  EditButton,
  ViewButton,
} from '@/components/ui'
import { formatTimeAgo } from '@/utils/date'
import { type Prisma } from '@orm'

type GameWithRelations = Prisma.GameGetPayload<{
  include: {
    system: { include: { emulators: true } }
    listings: {
      include: {
        device: { include: { brand: true } }
        emulator: true
        performance: true
        author: {
          select: {
            id: true
            name: true
            email: true
          }
        }
        _count: { select: { comments: true } }
      }
    }
  }
}>

interface Props {
  game: GameWithRelations
}

export function GameRelatedData(props: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Related Listings ({props.game.listings.length})
      </h2>

      {props.game.listings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No listings for this game yet.
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
                <tr
                  key={listing.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {listing.device.brand.name} {listing.device.modelName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {listing.emulator.name}
                  </td>
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
                    {formatTimeAgo(listing.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EditButton
                      href={`/admin/listings/${listing.id}/edit`}
                      title="Edit Listing"
                    />
                    <ViewButton
                      href={`/listings/${listing.id}`}
                      title="View Details"
                    />
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
