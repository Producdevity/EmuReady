'use client'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
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
  TrashIcon,
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

export default function ListingsPage() {
  const [systemId, setSystemId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deviceId, setDeviceId] = useState('')
  const [emulatorId, setEmulatorId] = useState('')
  const [performanceId, setPerformanceId] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  // Fetch all required data
  const { data: systems } = api.systems.list.useQuery()
  const { data: devices } = api.devices.list.useQuery()
  const { data: emulators } = api.emulators.list.useQuery()
  const { data: performanceScales } = api.listings.performanceScales.useQuery()
  
  // Fetch listings with filters
  const { data, isLoading, error, refetch } = api.listings.list.useQuery({
    systemId: systemId || undefined,
    deviceId: deviceId || undefined,
    emulatorId: emulatorId || undefined,
    performanceId: performanceId ? parseInt(performanceId) : undefined,
    searchTerm: search || undefined,
    page,
    limit: 10,
  })
  
  const listings = data?.listings || []
  const pagination = data?.pagination

  // Delete mutation
  const deleteListing = api.listings.delete.useMutation({
    onSuccess: () => {
      // Refetch listings after deletion
      refetch()
      setDeleteConfirmId(null)
    },
  })

  // Handle filter changes
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSystemId(e.target.value)
    setPage(1)
  }
  
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }
  
  const handleDeviceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDeviceId(e.target.value)
    setPage(1)
  }
  
  const handleEmulatorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setEmulatorId(e.target.value)
    setPage(1)
  }
  
  const handlePerformanceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPerformanceId(e.target.value)
    setPage(1)
  }
  
  // Pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // Delete confirmation
  const confirmDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteListing.mutate({ id })
    } else {
      setDeleteConfirmId(id)
    }
  }
  
  if (isLoading) return <div className="p-8 text-center">Loading listings...</div>
  if (error) return <div className="p-8 text-center text-red-500">Failed to load listings.</div>

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for filters */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-2xl shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" /> Filters
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">System</label>
            <Input
              leftIcon={<CpuChipIcon className="w-5 h-5" />}
              as="select"
              value={systemId}
              onChange={(e) => handleFilterChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)}
              className="mb-0"
            >
              <option value="">All Systems</option>
              {systems?.map((sys: { id: string; name: string }) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </Input>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Device</label>
            <Input
              leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
              as="select"
              value={deviceId}
              onChange={(e) => handleDeviceChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)}
              className="mb-0"
            >
              <option value="">All Devices</option>
              {devices?.map((device: { id: string; brand: string; modelName: string }) => (
                <option key={device.id} value={device.id}>
                  {device.brand} {device.modelName}
                </option>
              ))}
            </Input>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Emulator</label>
            <Input
              leftIcon={<CpuChipIcon className="w-5 h-5" />}
              as="select"
              value={emulatorId}
              onChange={(e) => handleEmulatorChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)}
              className="mb-0"
            >
              <option value="">All Emulators</option>
              {emulators?.map((emulator: { id: string; name: string }) => (
                <option key={emulator.id} value={emulator.id}>
                  {emulator.name}
                </option>
              ))}
            </Input>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Performance</label>
            <Input
              leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
              as="select"
              value={performanceId}
              onChange={(e) => handlePerformanceChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)}
              className="mb-0"
            >
              <option value="">All Performance</option>
              {performanceScales?.map((perf: { id: number; label: string }) => (
                <option key={perf.id} value={perf.id.toString()}>
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
              placeholder="Search games or notes..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </aside>
      
      {/* Main Content - Listings */}
      <section className="flex-1 p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Game Listings
          </h1>
          <Link
            href="/listings/new"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            Add New Listing
          </Link>
        </div>
        
        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
            <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Game</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">System</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Device</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Emulator</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Performance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Author</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                    <Link href={`/games/${listing.game.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {listing.game.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {listing.game.system?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {listing.device ? `${listing.device.brand} ${listing.device.modelName}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {listing.emulator?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        listing.performance?.label === 'Perfect' ? 'success' :
                        listing.performance?.label === 'Great' ? 'info' :
                        listing.performance?.label === 'Playable' ? 'warning' : 
                        'danger'
                      }
                    >
                      {listing.performance?.label || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {listing.author?.name || 'Anonymous'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/listings/${listing.id}`}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-blue-400 text-xs"
                      >
                        <EyeIcon className="w-4 h-4" /> View
                      </Link>
                      
                      {isAdmin && (
                        <button
                          onClick={() => confirmDelete(listing.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-150 shadow-sm hover:scale-105 focus:ring-2 focus:ring-red-400 text-xs ${
                            deleteConfirmId === listing.id
                              ? 'bg-red-700 text-white hover:bg-red-800'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          {deleteConfirmId === listing.id ? 'Confirm' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {listings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 dark:text-gray-400">No listings found matching the criteria.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
