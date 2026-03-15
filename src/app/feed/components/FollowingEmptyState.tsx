'use client'

import { Rss } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'

function FollowingEmptyState() {
  const topContributorsQuery = api.users.topContributorsSummary.useQuery({
    limit: 5,
  })

  const contributors = topContributorsQuery.data?.allTime ?? []

  return (
    <div className="text-center py-12">
      <Rss className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activity yet</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Follow users to see their reports here.
      </p>

      {contributors.length > 0 && (
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Suggested users to follow
          </h3>
          <div className="space-y-3">
            {contributors.slice(0, 5).map((contributor) => (
              <Link
                key={contributor.id}
                href={`/users/${contributor.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  <Image
                    src={contributor.profileImage ?? '/placeholder/profile.svg'}
                    alt={contributor.name ?? 'User'}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {contributor.name ?? 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contributor.contributions.total} contributions
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button variant="primary" asChild>
          <Link href="/listings">Browse Reports</Link>
        </Button>
      </div>
    </div>
  )
}

export default FollowingEmptyState
