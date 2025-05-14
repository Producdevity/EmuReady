import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getGameById } from '../data'
import { Badge } from '@/components/ui/badge'
import { OptimizedImage } from '@/components/ui/optimizedImage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GameDetailsPage(props: Props) {
  const { id } = await props.params
  const game = await getGameById(id)

  if (!game) notFound()

  // Safely access the imageUrl property
  const imageUrl = 'imageUrl' in game ? (game.imageUrl as string) : null

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/games"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back to Games
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4 flex-shrink-0">
              {imageUrl ? (
                <OptimizedImage
                  src={imageUrl}
                  alt={game.title}
                  width={300}
                  height={400}
                  className="w-full rounded-lg shadow-md"
                  objectFit="contain"
                  fallbackSrc="/placeholder/game.svg"
                />
              ) : (
                <Image
                  src="/placeholder/game.svg"
                  alt="No image available"
                  className="w-full rounded-lg shadow-md"
                  width={300}
                  height={400}
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {game.title}
                  </h1>
                  <div className="mt-2">
                    <Badge variant="default">System: {game.system?.name}</Badge>
                  </div>
                </div>
                <Link
                  href={`/listings/new?gameId=${game.id}`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
                >
                  Add Listing for this Game
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Compatibility Listings
          </h2>

          {game.listings && game.listings.length > 0 ? (
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
                  {game.listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.device
                          ? `${listing.device.brand} ${listing.device.modelName}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.emulator?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            listing.performance?.label === 'Perfect'
                              ? 'success'
                              : listing.performance?.label === 'Great'
                                ? 'info'
                                : listing.performance?.label === 'Playable'
                                  ? 'warning'
                                  : 'danger'
                          }
                        >
                          {listing.performance?.label || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.author?.name ?? 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing._count.comments || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View Details
                        </Link>
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
                href={`/listings/new?gameId=${game.id}`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
              >
                Be the first to add a listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
