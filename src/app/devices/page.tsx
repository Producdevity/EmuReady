'use client'

import { Search, Smartphone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { isEmpty } from 'remeda'
import {
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
  Badge,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import DeviceViewModal from './components/DeviceViewModal'

type DeviceSortField = 'brand' | 'modelName' | 'soc'
type DeviceData = RouterOutput['devices']['get']['devices'][number]

const DEVICES_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'soc', label: 'SoC', defaultVisible: true },
  { key: 'listings', label: 'Reports', defaultVisible: true },
]

function DevicesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<DeviceSortField>('brand')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const columnVisibility = useColumnVisibility(DEVICES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.devices,
  })

  const devicesQuery = api.devices.get.useQuery({
    search: isEmpty(search) ? undefined : search,
    sortField: sortField,
    sortDirection: sortDirection,
    page: page,
    limit: 20,
  })

  const devices = devicesQuery.data?.devices ?? []
  const pagination = devicesQuery.data?.pagination

  const openModal = (device: DeviceData) => {
    setSelectedDevice(device)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedDevice(null)
  }

  const handleSort = (field: string) => {
    const typedField = field as DeviceSortField
    if (sortField === typedField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(typedField)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value)
    setPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Browse Devices
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore tested devices and their compatibility reports
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search devices, brands, or SoCs..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <ColumnVisibilityControl
            columns={DEVICES_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button
            variant="outline"
            onClick={() => {
              setSearch('')
              setPage(1)
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {devicesQuery.isPending ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner text="Loading devices..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {columnVisibility.isColumnVisible('brand') && (
                    <SortableHeader
                      label="Brand"
                      field="brand"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('model') && (
                    <SortableHeader
                      label="Model"
                      field="modelName"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('soc') && (
                    <SortableHeader
                      label="SoC"
                      field="soc"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('listings') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reports
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => openModal(device)}
                  >
                    {columnVisibility.isColumnVisible('brand') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.brand.name}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('model') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {device.modelName}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('soc') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {device.soc?.name || (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            Not specified
                          </span>
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('listings') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Badge>{device._count?.listings ?? 0}</Badge>
                          {(device._count?.listings ?? 0) > 0 && (
                            <Link
                              href={`/listings?deviceIds=${device.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {!devicesQuery.isPending && devices.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg">
                        {search
                          ? 'No devices found matching your search.'
                          : 'No devices available.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Device Modal */}
      <DeviceViewModal
        isOpen={modalOpen}
        onClose={closeModal}
        deviceData={selectedDevice}
      />
    </div>
  )
}

export default DevicesPage
