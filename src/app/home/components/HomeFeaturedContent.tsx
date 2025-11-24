import { MessageCircle, ThumbsUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { LoadingSpinner, PerformanceBadge, SuccessRateBar } from '@/components/ui'
import { api } from '@/lib/api'
import getImageUrl from '@/utils/getImageUrl'

export function HomeFeaturedContent() {
  const listingsQuery = api.listings.featured.useQuery()

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Latest Compatibility Reports
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover what&apos;s working well across different devices and emulators
        </p>
      </div>

      {listingsQuery.isPending ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner text="Loading featured content..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 sm:px-4">
          {(listingsQuery.data ?? []).map((listing) => (
            <div
              key={listing.id}
              className="group bg-white/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-500 transform hover:scale-[1.02] backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="relative overflow-hidden">
                <Image
                  src={getImageUrl(listing.game.imageUrl, listing.game.title)}
                  alt={listing.game.title}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3 min-h-[3.5rem]">
                  <h3 className="font-semibold text-gray-900 dark:text-white break-words leading-tight min-h-[2.5rem] flex items-center">
                    <Link href={`/listings/${listing.id}`}>{listing.game.title}</Link>
                  </h3>
                  <PerformanceBadge
                    rank={listing.performance?.rank ?? 0}
                    label={listing.performance?.label ?? 'N/A'}
                    description={listing.performance?.description}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>
                    {listing.game.system?.id ? (
                      <Link
                        href={`/listings?systemId=${listing.game.system.id}`}
                        className="text-blue-600 dark:text-indigo-400 hover:underline"
                      >
                        {listing.game.system.name}
                      </Link>
                    ) : (
                      'Unknown System'
                    )}
                  </span>
                  <span>
                    {listing.emulator?.id ? (
                      <Link
                        href={`/listings?emulatorId=${listing.emulator.id}`}
                        className="text-blue-600 dark:text-indigo-400 hover:underline"
                      >
                        {listing.emulator.name}
                      </Link>
                    ) : (
                      'Unknown Emulator'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>
                    {listing.device?.id ? (
                      <Link
                        href={`/listings?deviceId=${listing.device.id}`}
                        className="text-blue-600 dark:text-indigo-400 hover:underline"
                      >
                        {listing.device.brand.name} {listing.device.modelName}
                      </Link>
                    ) : (
                      'Unknown Device'
                    )}
                  </span>
                  <span>
                    {listing.performance?.id ? (
                      <Link
                        href={`/listings?performanceId=${listing.performance.id}`}
                        className="text-blue-600 dark:text-indigo-400 hover:underline"
                      >
                        {listing.performance.label}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>
                    by{' '}
                    <Link
                      href={`/users/${listing.author?.id}`}
                      className="text-blue-600 dark:text-indigo-400 hover:underline"
                    >
                      {listing.author?.name ?? 'Anonymous'}
                    </Link>
                  </span>
                </div>
                {/* Success Rate Bar and Stats */}
                <div className="flex flex-col gap-1 mt-4">
                  <SuccessRateBar
                    rate={listing.successRate * 100}
                    voteCount={listing._count.votes}
                    hideVoteCount={false}
                  />
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span title="Votes" className="flex items-center gap-1">
                    <ThumbsUp className="inline w-4 h-4 text-blue-400" />
                    {listing._count?.votes ?? 0} votes
                  </span>
                  <span title="Comments" className="flex items-center gap-1">
                    <MessageCircle className="inline w-4 h-4 text-indigo-400" />
                    {listing._count?.comments ?? 0} comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
