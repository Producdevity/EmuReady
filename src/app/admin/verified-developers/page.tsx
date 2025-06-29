'use client'

import { Shield, UserCheck, Search } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { AdminTableContainer, AdminStatsDisplay } from '@/components/admin'
import { EmulatorIcon } from '@/components/icons'
import {
  Button,
  ColumnVisibilityControl,
  SortableHeader,
  VerifiedDeveloperBadge,
  useConfirmDialog,
  LoadingSpinner,
  SelectInput,
  Input,
} from '@/components/ui'
import { DeleteButton, EditButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import EditVerifiedDeveloperModal from './components/EditVerifiedDeveloperModal'
import VerifyDeveloperModal from './components/VerifyDeveloperModal'

type VerifiedDeveloperSortField = 'verifiedAt' | 'user.name' | 'emulator.name'

const VERIFIED_DEVELOPERS_COLUMNS: ColumnDefinition[] = [
  { key: 'user', label: 'Developer', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'verifier', label: 'Verified By', defaultVisible: true },
  { key: 'verifiedAt', label: 'Verified', defaultVisible: true },
  { key: 'notes', label: 'Notes', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

type VerifiedDeveloper = {
  id: string
  emulatorId: string
  notes: string | null
  user: {
    id: string
    name: string | null
    email: string
    profileImage: string | null
  }
  emulator: {
    id: string
    name: string
    logo: string | null
  }
  verifier: {
    id: string
    name: string | null
    email: string
  }
  verifiedAt: Date
}

function AdminVerifiedDevelopersPage() {
  const utils = api.useUtils()
  const table = useAdminTable<VerifiedDeveloperSortField>({
    defaultLimit: 20,
    defaultSortField: 'verifiedAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(VERIFIED_DEVELOPERS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminVerifiedDevelopers,
  })

  const confirm = useConfirmDialog()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDeveloper, setSelectedDeveloper] =
    useState<VerifiedDeveloper | null>(null)
  const [emulatorFilter, setEmulatorFilter] = useState('')

  const emulatorsQuery = api.emulators.get.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const verifiedDevelopersQuery =
    api.verifiedDevelopers.getVerifiedDevelopers.useQuery({
      page: table.page,
      limit: table.limit,
      search: table.search || undefined,
      emulatorFilter: emulatorFilter || undefined,
    })

  const removeVerifiedDeveloperMutation =
    api.verifiedDevelopers.removeVerifiedDeveloper.useMutation({
      onSuccess: (result) => {
        toast.success(result.message)
        utils.verifiedDevelopers.getVerifiedDevelopers.invalidate()
      },
      onError: (err) => {
        toast.error(
          `Failed to remove verified developer: ${getErrorMessage(err)}`,
        )
      },
    })

  const handleRemove = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove Verified Developer',
      description:
        'Are you sure you want to remove this verified developer? This action cannot be undone.',
    })

    if (!confirmed) return

    removeVerifiedDeveloperMutation.mutate({ id })
  }

  const handleEdit = (developer: VerifiedDeveloper) => {
    setSelectedDeveloper(developer)
    setShowEditModal(true)
  }

  const handleModalSuccess = () => {
    utils.verifiedDevelopers.getVerifiedDevelopers.invalidate()
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedDeveloper(null)
  }

  const handleClearFilters = () => {
    table.setSearch('')
    setEmulatorFilter('')
    table.setPage(1)
  }

  const emulatorFilterOptions = [
    { id: '', name: 'All Emulators' },
    ...(emulatorsQuery.data?.emulators.map((emulator) => ({
      id: emulator.id,
      name: emulator.name,
    })) ?? []),
  ]

  if (verifiedDevelopersQuery.error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load verified developers.
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Verified Developers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage verified developers for emulators
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl
            columns={VERIFIED_DEVELOPERS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Verify Developer
          </Button>
        </div>
      </div>

      {verifiedDevelopersQuery.data && (
        <AdminStatsDisplay
          className="mb-6"
          stats={[
            {
              label: 'Total Verified',
              value: verifiedDevelopersQuery.data.verifiedDevelopers.length,
              color: 'blue',
            },
            {
              label: 'Emulators Covered',
              value: new Set(
                verifiedDevelopersQuery.data.verifiedDevelopers.map(
                  (vd) => vd.emulator.id,
                ),
              ).size,
              color: 'gray',
            },
            {
              label: 'Unique Developers',
              value: new Set(
                verifiedDevelopersQuery.data.verifiedDevelopers.map(
                  (vd) => vd.user.id,
                ),
              ).size,
              color: 'gray',
            },
          ]}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search developers, emulators, or notes..."
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <SelectInput
              label="Emulator Filter"
              hideLabel={true}
              value={emulatorFilter}
              onChange={(ev) => {
                setEmulatorFilter(ev.target.value)
                table.setPage(1)
              }}
              options={emulatorFilterOptions}
            />
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="h-full"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <AdminTableContainer>
        {verifiedDevelopersQuery.isLoading ? (
          <LoadingSpinner text="Loading verified developers..." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('user') && (
                  <SortableHeader
                    label="Developer"
                    field="user.name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('emulator') && (
                  <SortableHeader
                    label="Emulator"
                    field="emulator.name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('verifier') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Verified By
                  </th>
                )}
                {columnVisibility.isColumnVisible('verifiedAt') && (
                  <SortableHeader
                    label="Verified"
                    field="verifiedAt"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('notes') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
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
              {verifiedDevelopersQuery.data?.verifiedDevelopers.map(
                (verifiedDev) => (
                  <tr
                    key={verifiedDev.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('user') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {verifiedDev.user.profileImage && (
                            <Image
                              src={verifiedDev.user.profileImage}
                              alt={
                                verifiedDev.user.name || verifiedDev.user.email
                              }
                              width={32}
                              height={32}
                              className="rounded-full mr-3"
                              unoptimized
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {verifiedDev.user.name || verifiedDev.user.email}
                              <VerifiedDeveloperBadge size="sm" />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {verifiedDev.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('emulator') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {verifiedDev.emulator.logo && (
                            <EmulatorIcon
                              logo={verifiedDev.emulator.logo}
                              name={verifiedDev.emulator.name}
                              showLogo={true}
                              size="md"
                            />
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {verifiedDev.emulator.name}
                          </span>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('verifier') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {verifiedDev.verifier.name ||
                          verifiedDev.verifier.email}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('verifiedAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div title={formatDateTime(verifiedDev.verifiedAt)}>
                          {formatTimeAgo(verifiedDev.verifiedAt)}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('notes') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {verifiedDev.notes || '-'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <EditButton
                            onClick={() => handleEdit(verifiedDev)}
                            title="Edit Verified Developer"
                          />
                          <DeleteButton
                            onClick={() => handleRemove(verifiedDev.id)}
                            title="Remove Verification"
                            isLoading={
                              removeVerifiedDeveloperMutation.isPending
                            }
                            disabled={removeVerifiedDeveloperMutation.isPending}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ),
              )}
              {verifiedDevelopersQuery.data?.verifiedDevelopers.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p>No verified developers found.</p>
                      <p className="text-sm mt-1">
                        {table.search || emulatorFilter
                          ? 'Try adjusting your search or filters.'
                          : 'Add your first verified developer.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      <VerifyDeveloperModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditVerifiedDeveloperModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedDeveloper(null)
        }}
        onSuccess={handleModalSuccess}
        verifiedDeveloper={selectedDeveloper}
      />
    </div>
  )
}

export default AdminVerifiedDevelopersPage
