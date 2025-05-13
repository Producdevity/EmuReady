'use client'
import { api } from '@/lib/api'
import type { Listing, PerformanceScale } from '@orm'
import { useState, type ChangeEvent } from 'react'
import { useSession } from 'next-auth/react'
import { Badge, Input } from '@/components/ui'
import Link from 'next/link'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

// Move SuccessRateBar above ListingsPage
function SuccessRateBar({ rate }: { rate: number }) {
  let color = 'bg-gray-300'
  if (rate >= 80) color = 'bg-green-500'
  else if (rate >= 50) color = 'bg-yellow-400'
  else if (rate > 0) color = 'bg-red-500'
  return (
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded">
      <div
        className={`h-4 rounded ${color}`}
        style={{ width: `${rate}%`, transition: 'width 0.3s' }}
      />
      <span className="ml-2 text-xs text-gray-700 dark:text-gray-200 align-middle">
        {rate}%
      </span>
    </div>
  )
}

export default function ListingsPage() {
  const [systemId, setSystemId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editGame, setEditGame] = useState<{
    id: string
    title: string
    systemId: string
  } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSystemId, setEditSystemId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [emulatorId, setEmulatorId] = useState('')
  const [performanceId, setPerformanceId] = useState('')

  // Fetch systems for filter dropdown
  const { data: systems, isLoading: systemsLoading } =
    api.systems.list.useQuery()

  // Fetch games with filters
  const { data, isLoading, error } = api.games.list.useQuery({
    systemId: systemId || undefined,
    search: search || undefined,
    offset: (page - 1) * 12,
    limit: 12,
  })
  const games = data?.games || []
  const pagination = data?.pagination

  const { data: session } = useSession()
  const deleteGame = api.games.delete.useMutation()
  const updateGame = api.games.update.useMutation()
  const { data: devices } = api.devices.list.useQuery()
  const { data: emulators } = api.emulators.list.useQuery()
  const { data: performanceScales } = api.listings.performanceScales.useQuery()

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSystemId(e.target.value)
    setPage(1)
  }
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  const handleDeviceChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setDeviceId(e.target.value)
  const handleEmulatorChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setEmulatorId(e.target.value)
  const handlePerformanceChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setPerformanceId(e.target.value)

  if (isLoading) return <div className="p-8 text-center">Loading games...</div>
  if (error)
    return (
      <div className="p-8 text-center text-red-500">Failed to load games.</div>
    )

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-2xl shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />{' '}
          Filters
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">System</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              value={systemId}
              onChange={handleFilterChange}
              disabled={systemsLoading}
            >
              <option value="">All Systems</option>
              {systems?.map((sys: { id: string; name: string }) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Device</label>
            <Input
              leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
              placeholder="All Devices"
              as="select"
              value={deviceId}
              onChange={(e) =>
                handleDeviceChange(
                  e as unknown as ChangeEvent<HTMLSelectElement>,
                )
              }
              className="mb-0"
            >
              <option value="">All Devices</option>
              {devices?.map(
                (dev: { id: string; brand: string; modelName: string }) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.brand} {dev.modelName}
                  </option>
                ),
              )}
            </Input>
          </div>
          <div>
            <label className="block mb-1 font-medium">Emulator</label>
            <Input
              leftIcon={<CpuChipIcon className="w-5 h-5" />}
              placeholder="All Emulators"
              as="select"
              value={emulatorId}
              onChange={(e) =>
                handleEmulatorChange(
                  e as unknown as ChangeEvent<HTMLSelectElement>,
                )
              }
              className="mb-0"
            >
              <option value="">All Emulators</option>
              {emulators?.map((emu: { id: string; name: string }) => (
                <option key={emu.id} value={emu.id}>
                  {emu.name}
                </option>
              ))}
            </Input>
          </div>
          <div>
            <label className="block mb-1 font-medium">Performance</label>
            <Input
              leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
              placeholder="All Performance"
              as="select"
              value={performanceId}
              onChange={(e) =>
                handlePerformanceChange(
                  e as unknown as React.ChangeEvent<HTMLSelectElement>,
                )
              }
              className="mb-0"
            >
              <option value="">All Performance</option>
              {performanceScales?.map((perf: { id: number; label: string }) => (
                <option key={perf.id} value={perf.id}>
                  {perf.label}
                </option>
              ))}
            </Input>
          </div>
          <div>
            <label className="block mb-1 font-medium">Search</label>
            <Input
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <section className="flex-1 p-4 overflow-x-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">
          Game Listings
        </h1>
        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
            <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Title
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  System
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Performance
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Success Rate
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Listings
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {games.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    No games found.
                  </td>
                </tr>
              )}
              {games.map(
                (game: {
                  id: string
                  title: string
                  system?: { id: string; name: string }
                  systemId: string
                  _count?: { listings: number }
                  listings?: (Listing & { performance?: PerformanceScale })[]
                }) => {
                  // Calculate success rate (e.g., % of listings with performance 'Perfect' or 'Great')
                  const total = game.listings?.length ?? 0
                  const good =
                    game.listings?.filter(
                      (l) =>
                        l.performance?.label === 'Perfect' ||
                        l.performance?.label === 'Great',
                    ).length ?? 0
                  const successRate =
                    total > 0 ? Math.round((good / total) * 100) : 0
                  // Find most common performance for badge
                  const perfCounts: Record<string, number> = {}
                  game.listings?.forEach((l) => {
                    if (l.performance?.label)
                      perfCounts[l.performance.label] =
                        (perfCounts[l.performance.label] || 0) + 1
                  })
                  const topPerf =
                    Object.entries(perfCounts).sort(
                      (a, b) => b[1] - a[1],
                    )[0]?.[0] ?? ''
                  let badgeVariant:
                    | 'secondary'
                    | 'success'
                    | 'info'
                    | 'warning'
                    | 'danger' = 'secondary'
                  if (topPerf === 'Perfect') badgeVariant = 'success'
                  else if (topPerf === 'Great') badgeVariant = 'info'
                  else if (topPerf === 'Playable') badgeVariant = 'warning'
                  else if (topPerf === 'Unplayable') badgeVariant = 'danger'
                  return (
                    <tr
                      key={game.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {game.title}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        {game.system?.name}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={badgeVariant}>{topPerf || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <SuccessRateBar rate={successRate} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {game._count?.listings ?? 0}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <Link href={`/listings/${game.id}`} passHref legacyBehavior>
                          <a
                            aria-label="View Listings"
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-blue-400"
                          >
                            <EyeIcon className="w-5 h-5" /> View
                          </a>
                        </Link>
                        {session?.user.role === 'ADMIN' && (
                          <>
                            <button
                              aria-label="Edit Game"
                              className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-yellow-400"
                              onClick={() => {
                                setEditGame({
                                  id: game.id,
                                  title: game.title,
                                  systemId: game.systemId,
                                })
                                setEditTitle(game.title)
                                setEditSystemId(game.systemId)
                                setEditModalOpen(true)
                              }}
                            >
                              <PencilSquareIcon className="w-5 h-5" /> Edit
                            </button>
                            <button
                              aria-label="Delete Game"
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-red-400"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Delete game \"${game.title}\"? This cannot be undone.`,
                                  )
                                ) {
                                  await deleteGame.mutateAsync({ id: game.id })
                                }
                              }}
                              disabled={deleteGame.isPending}
                            >
                              <TrashIcon className="w-5 h-5" />{' '}
                              {deleteGame.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                },
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <nav className="mt-8 flex justify-center">
            <ul className="flex flex-row flex-nowrap overflow-x-auto gap-2 px-2 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-full">
              {/* First button */}
              {page > 2 && (
                <li>
                  <button
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    onClick={() => handlePageChange(1)}
                    aria-label="First page"
                  >
                    « First
                  </button>
                </li>
              )}
              {/* Previous button */}
              <li>
                <button
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ‹ Prev
                </button>
              </li>
              {/* Page numbers with ellipsis */}
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.pages ||
                    (p >= page - 2 && p <= page + 2),
                )
                .reduce((acc: (number | string)[], p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  typeof p === 'number' ? (
                    <li key={p}>
                      <button
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                          p === page
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => handlePageChange(p)}
                        disabled={p === page}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    </li>
                  ) : (
                    <li
                      key={`ellipsis-${idx}`}
                      className="flex items-center px-2 text-gray-400"
                    >
                      …
                    </li>
                  ),
                )}
              {/* Next button */}
              <li>
                <button
                  className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </li>
              {/* Last button */}
              {page < pagination.pages - 1 && (
                <li>
                  <button
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    onClick={() => handlePageChange(pagination.pages)}
                    aria-label="Last page"
                  >
                    Last »
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
        {/* Edit Game Modal */}
        {editModalOpen && editGame && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg relative">
              <h2 className="text-xl font-bold mb-4">Edit Game</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await updateGame.mutateAsync({
                    id: editGame.id,
                    title: editTitle,
                    systemId: editSystemId,
                  })
                  setEditModalOpen(false)
                  setEditGame(null)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1 font-medium">Title</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">System</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
                    value={editSystemId}
                    onChange={(e) => setEditSystemId(e.target.value)}
                    required
                  >
                    <option value="">Select system...</option>
                    {systems?.map((sys: { id: string; name: string }) => (
                      <option key={sys.id} value={sys.id}>
                        {sys.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    disabled={updateGame.isPending}
                  >
                    {updateGame.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {session?.user && (
          <Link href="/listings/new">
            <button className="mt-10 px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105 w-full max-w-xs mx-auto block">
              Add Listing
            </button>
          </Link>
        )}
      </section>
    </main>
  )
}
