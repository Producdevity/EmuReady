'use client'

import Link from 'next/link'
import { getPcSpecsSummary } from '@/app/games/[id]/utils/getPcSpecsSummary'
import { EmulatorIcon } from '@/components/icons'
import { AuthorDisplay } from '@/components/listings/AuthorDisplay'
import {
  Badge,
  PerformanceBadge,
  EditButton,
  ViewButton,
  LocalizedDate,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
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
  const emulatorLogos = useEmulatorLogos()
  const canSeeBannedUsers = roleIncludesRole(props.userRole, Role.MODERATOR)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        PC Reports <Badge>{props.pcListings?.length || 0}</Badge>
      </h2>

      {props.pcListings && props.pcListings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PC Specs
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {props.pcListings.map((listing) => {
                const specs = getPcSpecsSummary(listing)

                return (
                  <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[240px] cursor-help truncate">{specs.summary}</div>
                        </TooltipTrigger>
                        <TooltipContent className="w-fit max-w-xs text-left">
                          <div className="font-semibold text-xs uppercase tracking-wide text-primary-foreground">
                            PC Specs
                          </div>
                          <div className="mt-1 space-y-1 text-xs leading-snug">
                            {specs.details.length === 0 ? (
                              <div>No additional specs provided.</div>
                            ) : (
                              specs.details.map((detail) => (
                                <div key={detail.label}>
                                  <span className="font-semibold">{detail.label}:</span>{' '}
                                  {detail.value}
                                </div>
                              ))
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {listing.emulator ? (
                        <EmulatorIcon
                          name={listing.emulator.name}
                          logo={listing.emulator.logo}
                          showLogo={emulatorLogos.isHydrated && emulatorLogos.showEmulatorLogos}
                          size="md"
                        />
                      ) : (
                        'N/A'
                      )}
                    </td>
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
                                listing.status === ApprovalStatus.REJECTED ? 'danger' : 'warning'
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
                      <LocalizedDate date={listing.createdAt} format="date" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {props.hasPermission && (
                          <EditButton
                            href={`/admin/pc-listings/${listing.id}/edit`}
                            title="Edit PC Report"
                          />
                        )}
                        <ViewButton href={`/pc-listings/${listing.id}`} title="View Details" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No PC Compatibility Reports yet for this game.
          </p>
          <Link
            href={`/pc-listings/new?gameId=${props.gameId}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
          >
            Be the first to add a PC Compatibility Report
          </Link>
        </div>
      )}
    </div>
  )
}
