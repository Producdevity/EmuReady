'use client'

import { Search, Monitor, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, type ChangeEvent, Suspense } from 'react'
import { isEmpty } from 'remeda'
import { EmulatorIcon } from '@/components/icons'
import {
  Badge,
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
  ViewButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import EmulatorViewModal from './components/EmulatorViewModal'

type EmulatorSortField = 'name'
type EmulatorData = RouterOutput['emulators']['get']['emulators'][number]
type EmulatorByIdData = RouterOutput['emulators']['byId']
type EmulatorUnion = EmulatorData | EmulatorByIdData

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Emulator', defaultVisible: true },
  { key: 'systems', label: 'Systems', defaultVisible: true },
  { key: 'listings', label: 'Reports', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true },
]

function EmulatorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<EmulatorSortField>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedEmulator, setSelectedEmulator] = useState<EmulatorUnion | null>(null)

  const columnVisibility = useColumnVisibility(EMULATORS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.emulators,
  })

  const emulatorsQuery = api.emulators.get.useQuery({
    search: isEmpty(search) ? undefined : search,
    sortField: sortField,
    sortDirection: sortDirection,
    page: page,
    limit: 20,
  })

  const emulators = useMemo(
    () => emulatorsQuery.data?.emulators ?? [],
    [emulatorsQuery.data?.emulators],
  )
  const pagination = emulatorsQuery.data?.pagination

  // Get emulatorId from URL params
  const emulatorIdFromUrl = searchParams.get('emulatorId')
  const modalOpen = !!emulatorIdFromUrl

  // Check if emulator is in current page
  const emulatorInCurrentPage = useMemo(
    () => emulators.find((e) => e.id === emulatorIdFromUrl),
    [emulators, emulatorIdFromUrl],
  )

  // Fetch single emulator if it's in URL but not in current page
  const singleEmulatorQuery = api.emulators.byId.useQuery(
    { id: emulatorIdFromUrl! },
    {
      enabled: !!emulatorIdFromUrl && !emulatorInCurrentPage,
    },
  )

  // Set selected emulator from either the list or the single query
  useEffect(() => {
    if (!emulatorIdFromUrl) {
      setSelectedEmulator(null)
      return
    }

    const emulator = emulatorInCurrentPage || singleEmulatorQuery.data
    if (emulator) {
      setSelectedEmulator(emulator)
    }
  }, [emulatorIdFromUrl, emulatorInCurrentPage, singleEmulatorQuery.data])

  const openModal = (emulator: EmulatorData) => {
    // Update URL with emulator ID
    const params = new URLSearchParams(searchParams.toString())
    params.set('emulatorId', emulator.id)
    router.replace(`/emulators?${params.toString()}`)
    setSelectedEmulator(emulator)
  }

  const closeModal = () => {
    // Remove emulatorId from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('emulatorId')
    const query = params.toString()
    router.replace(`/emulators${query ? `?${query}` : ''}`)
    setSelectedEmulator(null)
  }

  const handleSort = (field: string) => {
    const typedField = field as EmulatorSortField
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
    <div className="container mx-auto px-2 sm:px-4 pt-4">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Browse Emulators
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover emulators and their compatibility reports
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search emulators..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <ColumnVisibilityControl
            columns={EMULATORS_COLUMNS}
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
        {emulatorsQuery.isPending ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner text="Loading emulators..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {columnVisibility.isColumnVisible('name') && (
                    <SortableHeader
                      label="Emulator"
                      field="name"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('systems') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Systems
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('listings') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reports
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {emulators.map((emulator) => (
                  <tr
                    key={emulator.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => openModal(emulator)}
                  >
                    {columnVisibility.isColumnVisible('name') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <EmulatorIcon
                            logo={emulator.logo}
                            name={emulator.name}
                            showLogo={true}
                            size="md"
                          />
                          <div
                            className="text-sm font-medium text-gray-900 dark:text-white"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              openModal(emulator)
                            }}
                          >
                            {emulator.name}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('systems') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <Badge>{emulator._count?.systems ?? 0}</Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('listings') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Badge>{emulator._count?.listings ?? 0}</Badge>
                          {(emulator._count?.listings ?? 0) > 0 && (
                            <Link
                              href={`/listings?emulatorIds=${emulator.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              View Listings
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <ViewButton
                          onClick={(ev) => {
                            ev.stopPropagation()
                            openModal(emulator)
                          }}
                          title="View Emulator Details"
                        />
                      </td>
                    )}
                  </tr>
                ))}

                {!emulatorsQuery.isPending && emulators.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <Monitor className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg">
                        {search
                          ? 'No emulators found matching your search.'
                          : 'No emulators available.'}
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
            showLabel
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Emulator Modal */}
      <EmulatorViewModal isOpen={modalOpen} onClose={closeModal} emulatorData={selectedEmulator} />
    </div>
  )
}

function EmulatorsPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading emulators..." />}>
      <EmulatorsPage />
    </Suspense>
  )
}

export default EmulatorsPageWrapper
