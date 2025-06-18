'use client'

import { Search, Monitor } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import EmulatorIcon from '@/components/icons/EmulatorIcon'
import {
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import EmulatorViewModal from './components/EmulatorViewModal'

type EmulatorSortField = 'name'
type EmulatorData = RouterOutput['emulators']['get']['emulators'][number]

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Emulator', defaultVisible: true },
  { key: 'systems', label: 'Systems', defaultVisible: true },
  { key: 'listings', label: 'Reports', defaultVisible: true },
]

function EmulatorsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<EmulatorSortField>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedEmulator, setSelectedEmulator] = useState<EmulatorData | null>(
    null,
  )
  const [modalOpen, setModalOpen] = useState(false)

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

  const emulators = emulatorsQuery.data?.emulators ?? []
  const pagination = emulatorsQuery.data?.pagination

  const openModal = (emulator: EmulatorData) => {
    setSelectedEmulator(emulator)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
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
        {emulatorsQuery.isLoading ? (
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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {emulator.name}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('systems') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {emulator._count?.systems ?? 0}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('listings') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{emulator._count?.listings ?? 0}</span>
                          {(emulator._count?.listings ?? 0) > 0 && (
                            <Link
                              href={`/listings?emulatorIds=${emulator.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {!emulatorsQuery.isLoading && emulators.length === 0 && (
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
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="text-center mt-12">
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Emulator Modal */}
      <EmulatorViewModal
        isOpen={modalOpen}
        onClose={closeModal}
        emulatorData={selectedEmulator}
      />
    </div>
  )
}

export default EmulatorsPage
