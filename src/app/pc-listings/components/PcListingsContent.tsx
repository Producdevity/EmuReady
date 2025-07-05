'use client'

import { Monitor, Cpu, HardDrive, Calendar } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Pagination } from '@/components/ui/Pagination'
import { PerformanceBadge } from '@/components/ui/PerformanceBadge'
import { api } from '@/lib/api'
import { formatDate } from '@/utils/date'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { PcOs } from '@orm'

const osLabels: Record<PcOs | 'UNKNOWN', string> = {
  [PcOs.WINDOWS]: 'Windows',
  [PcOs.LINUX]: 'Linux',
  [PcOs.MACOS]: 'macOS',
  UNKNOWN: 'Unknown',
}

export function PcListingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse page from URL, default to 1
  const currentPage = Number(searchParams.get('page')) || 1
  const limit = 12

  // Parse filters from URL
  const filters = {
    searchTerm: searchParams.get('search') || undefined,
    systemIds: parseArrayParam(searchParams.get('systemIds')),
    cpuIds: parseArrayParam(searchParams.get('cpuIds')),
    gpuIds: parseArrayParam(searchParams.get('gpuIds')),
    emulatorIds: parseArrayParam(searchParams.get('emulatorIds')),
    performanceIds: parseNumberArrayParam(searchParams.get('performanceIds')),
    osFilter: parseArrayParam(searchParams.get('osFilter')) as PcOs[],
    memoryMin: searchParams.get('memoryMin')
      ? Number(searchParams.get('memoryMin'))
      : undefined,
    memoryMax: searchParams.get('memoryMax')
      ? Number(searchParams.get('memoryMax'))
      : undefined,
  }

  const pcListingsQuery = api.pcListings.get.useQuery({
    page: currentPage,
    limit,
    ...filters,
  })

  if (pcListingsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (pcListingsQuery.error) {
    return (
      <Card>
        <div className="p-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load PC listings
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!pcListingsQuery.data?.pcListings.length) {
    return (
      <Card>
        <div className="p-8">
          <div className="text-center">
            <Monitor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No PC listings found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Try adjusting your filters or be the first to add a PC
              compatibility report!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pcListingsQuery.data.pagination.total} PC compatibility{' '}
          {pcListingsQuery.data.pagination.total === 1 ? 'report' : 'reports'}
        </p>
      </div>

      {/* Listings Grid */}
      <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
        <div className="grid gap-4 md:gap-6 p-4">
          {pcListingsQuery.data.pcListings.map((listing) => (
            <Card
              key={listing.id}
              className="transition-shadow hover:shadow-md p-0 overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => router.push(`/pc-listings/${listing.id}`)}
              >
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-6">
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {listing.game.title}
                        </h3>
                        <div>
                          <SystemIcon
                            name={listing.game.system.name}
                            systemKey={listing.game.system.key}
                            size="sm"
                          />
                        </div>
                      </div>
                      <PerformanceBadge
                        rank={listing.performance?.rank ?? 8}
                        label={listing.performance?.label ?? 'N/A'}
                        description={listing.performance?.description}
                      />
                    </div>
                  </div>

                  {/* Hardware Info */}
                  <div className="space-y-2 lg:w-80">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {listing.cpu.brand.name}
                      </span>
                      <span>{listing.cpu.modelName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      {listing.gpu ? (
                        <>
                          <span className="font-medium">
                            {listing.gpu.brand.name}
                          </span>
                          <span>{listing.gpu.modelName}</span>
                        </>
                      ) : (
                        <span className="font-medium text-gray-500">
                          Integrated Graphics
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <span>{listing.memorySize}GB RAM</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {osLabels[listing.os] || osLabels.UNKNOWN}{' '}
                        {listing.osVersion}
                      </span>
                    </div>
                  </div>

                  {/* Emulator & Meta */}
                  <div className="space-y-2 lg:w-48">
                    <div>
                      <EmulatorIcon
                        logo={listing.emulator.logo}
                        name={listing.emulator.name}
                        showLogo={true}
                        size="md"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(listing.createdAt)}</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      by {listing.author.name}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pcListingsQuery.data.pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={pcListingsQuery.data.pagination.pages}
            onPageChange={(newPage) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', newPage.toString())
              router.push(`?${params.toString()}`, { scroll: false })
            }}
          />
        </div>
      )}
    </div>
  )
}
