'use client'

import Link from 'next/link'
import { EmulatorIcon } from '@/components/icons'
import { Badge, PerformanceBadge } from '@/components/ui'
import { EditButton, ViewButton } from '@/components/ui/table-buttons'
import useEmulatorLogos from '@/hooks/useEmulatorLogos'
import type { RouterOutput } from '@/types/trpc'

type Game = NonNullable<RouterOutput['games']['byId']>

interface Props {
  listings: Game['listings']
  gameId: Game['id']
  isAdmin: boolean
}

export function GameListingsSection(props: Props) {
  const emulatorLogos = useEmulatorLogos()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Compatibility Listings <Badge>{props.listings?.length || 0}</Badge>
      </h2>

      {props.listings && props.listings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Emulator
                </th>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {props.listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-block">
                        {listing.device && listing.device.brand
                          ? `${listing.device.brand.name} ${listing.device.modelName}`
                          : 'Unknown device'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {listing.emulator ? (
                      <EmulatorIcon
                        name={listing.emulator.name}
                        logo={listing.emulator.logo}
                        showLogo={
                          emulatorLogos.isHydrated &&
                          emulatorLogos.showEmulatorLogos
                        }
                        size="md"
                      />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PerformanceBadge
                      rank={listing.performance.rank}
                      label={listing.performance.label}
                      description={listing.performance?.description}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {listing.author?.id ? (
                      <Link
                        href={`/users/${listing.author.id}`}
                        className="text-blue-600 dark:text-indigo-400 hover:underline"
                      >
                        {listing.author?.name ?? 'Anonymous'}
                      </Link>
                    ) : (
                      (listing.author?.name ?? 'Anonymous')
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge>{listing._count.comments || 0}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {props.isAdmin && (
                        <EditButton
                          href={`/admin/listings/${listing.id}/edit`}
                          title="Edit Listing"
                        />
                      )}
                      <ViewButton
                        href={`/listings/${listing.id}`}
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
            No compatibility listings yet for this game.
          </p>
          <Link
            href={`/listings/new?gameId=${props.gameId}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
          >
            Be the first to add a listing
          </Link>
        </div>
      )}
    </div>
  )
}
