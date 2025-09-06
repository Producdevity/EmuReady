'use client'

import { LinkIcon, UnlinkIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import EmulatorModal from '@/app/admin/emulators/components/EmulatorModal'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import { EmulatorIcon } from '@/components/icons'
import {
  Button,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
  useConfirmDialog,
  DisplayToggleButton,
  EditButton,
  DeleteButton,
  TableButton,
  QuickEditButton,
  SettingsButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useEmulatorLogos, useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import { copyToClipboard } from '@/utils/copyToClipboard'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission as hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

type EmulatorSortField = 'name' | 'systemCount' | 'listingCount'

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'systemCount', label: 'Systems', defaultVisible: true },
  { key: 'listingCount', label: 'Listings', defaultVisible: true },
  { key: 'repoUrl', label: 'Repo', defaultVisible: true },
  { key: 'officialUrl', label: 'Official', defaultVisible: true },
  { key: 'androidGithubRepoUrl', label: 'Android', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminEmulatorsPage() {
  const table = useAdminTable<EmulatorSortField>({ defaultLimit: 20 })
  const utils = api.useUtils()
  const emulatorLogos = useEmulatorLogos()
  const columnVisibility = useColumnVisibility(EMULATORS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminEmulators,
  })

  // Get current user to check permissions
  const userQuery = api.users.me.useQuery()
  {
    /* TODO: validate this permission*/
  }
  const currentUserRole = userQuery.data?.role
  const currentUserId = userQuery.data?.id
  const userPermissions = userQuery.data?.permissions
  const isAdmin = hasRolePermission(currentUserRole, Role.ADMIN)
  const isModeratorOrHigher = hasRolePermission(currentUserRole, Role.MODERATOR)
  const canDeleteEmulators = isAdmin && hasPermission(userPermissions, PERMISSIONS.MANAGE_EMULATORS)

  const emulatorsStatsQuery = api.emulators.stats.useQuery()
  const emulatorsQuery = api.emulators.getForAdmin.useQuery({
    search: table.search ?? undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const pagination = emulatorsQuery.data?.pagination

  const deleteEmulator = api.emulators.delete.useMutation({
    onSuccess: () => {
      toast.success('Emulator deleted successfully!')
      utils.emulators.getForAdmin.invalidate().catch(console.error)
      utils.emulators.stats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete emulator: ${getErrorMessage(err)}`)
    },
  })
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [emulatorName, setEmulatorName] = useState('')

  const openModal = (emulator?: { id: string; name: string }) => {
    setEditId(emulator?.id ?? null)
    setEmulatorName(emulator?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setEmulatorName('')
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Emulator',
      description: 'Are you sure you want to delete this emulator? This action cannot be undone.',
    })

    if (!confirmed) return

    deleteEmulator.mutate({
      id,
    } satisfies RouterInput['emulators']['delete'])
  }

  return (
    <AdminPageLayout
      title="Manage Emulators"
      description="Manage emulator software for various gaming systems"
      headerActions={
        <>
          <DisplayToggleButton
            showLogos={emulatorLogos.showEmulatorLogos}
            onToggle={emulatorLogos.toggleEmulatorLogos}
            isHydrated={emulatorLogos.isHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl
            columns={EMULATORS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          {canDeleteEmulators && <Button onClick={() => openModal()}>Add Emulator</Button>}
        </>
      }
    >
      {emulatorsStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total Emulators',
              value: emulatorsStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Listings',
              value: emulatorsStatsQuery.data.withListings,
              color: 'green',
            },
            {
              label: 'With Systems',
              value: emulatorsStatsQuery.data.withSystems,
              color: 'purple',
            },
          ]}
          isLoading={emulatorsStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters<EmulatorSortField>
        table={table}
        searchPlaceholder="Search emulators by name..."
      />

      <AdminTableContainer>
        {emulatorsQuery.isPending ? (
          <LoadingSpinner text="Loading emulators..." />
        ) : emulatorsQuery.data?.emulators.length === 0 ? (
          <AdminTableNoResults hasQuery={!!table.search} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columnVisibility.isColumnVisible('name') && (
                      <SortableHeader
                        label="Name"
                        field="name"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('systemCount') && (
                      <SortableHeader
                        label="Systems"
                        field="systemCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('listingCount') && (
                      <SortableHeader
                        label="Listings"
                        field="listingCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('repoUrl') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Repo
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('officialUrl') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Official
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('androidGithubRepoUrl') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Android
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {emulatorsQuery.data?.emulators?.map((emulator) => (
                    <tr key={emulator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columnVisibility.isColumnVisible('name') && (
                        <td className="px-6 py-4">
                          {(() => {
                            const isVerified = emulator.verifiedDevelopers?.some(
                              (vd) => vd.userId === currentUserId || vd.user?.id === currentUserId,
                            )
                            const canManage = hasPermission(
                              userPermissions,
                              PERMISSIONS.MANAGE_EMULATORS,
                            )
                            const canEdit = canManage && (isModeratorOrHigher || isVerified)
                            return canEdit
                          })() ? (
                            <Link
                              href={`/admin/emulators/${emulator.id}`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                            >
                              <EmulatorIcon
                                name={emulator.name}
                                logo={emulator.logo}
                                showLogo={
                                  emulatorLogos.isHydrated && emulatorLogos.showEmulatorLogos
                                }
                              />
                            </Link>
                          ) : (
                            <div className="font-medium flex items-center gap-2">
                              <EmulatorIcon
                                name={emulator.name}
                                logo={emulator.logo}
                                showLogo={
                                  emulatorLogos.isHydrated && emulatorLogos.showEmulatorLogos
                                }
                              />
                            </div>
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('systemCount') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {emulator._count.systems}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('listingCount') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {emulator._count.listings}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('repoUrl') && (
                        <td className="px-6 py-4">
                          <UrlIndicator url={emulator.repositoryUrl} label="Repository URL" />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('officialUrl') && (
                        <td className="px-6 py-4">
                          <UrlIndicator url={emulator.officialUrl} label="Official URL" />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('androidGithubRepoUrl') && (
                        <td className="px-6 py-4">
                          <UrlIndicator
                            url={emulator.androidGithubRepoUrl}
                            label="Android GitHub Repo URL"
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Manage Custom Fields (permission + verified for developers) */}
                            {(() => {
                              const isVerified = emulator.verifiedDevelopers?.some(
                                (vd) =>
                                  vd.userId === currentUserId || vd.user?.id === currentUserId,
                              )
                              const canManageCF = hasPermission(
                                userPermissions,
                                PERMISSIONS.MANAGE_CUSTOM_FIELDS,
                              )
                              return canManageCF && (isModeratorOrHigher || isVerified)
                            })() && (
                              <SettingsButton
                                href={`/admin/emulators/${emulator.id}/custom-fields`}
                                disabled={deleteEmulator.isPending}
                                title={`Manage Custom Fields for ${emulator.name}`}
                              />
                            )}

                            {/* Edit and Quick Edit based on MANAGE_EMULATORS + verified for developers */}
                            {(() => {
                              const isVerified = emulator.verifiedDevelopers?.some(
                                (vd) =>
                                  vd.userId === currentUserId || vd.user?.id === currentUserId,
                              )
                              const canManage = hasPermission(
                                userPermissions,
                                PERMISSIONS.MANAGE_EMULATORS,
                              )
                              return canManage && (isModeratorOrHigher || isVerified)
                            })() && (
                              <EditButton
                                href={`/admin/emulators/${emulator.id}`}
                                disabled={deleteEmulator.isPending}
                                title={`Edit Emulator ${emulator.name}`}
                              />
                            )}
                            {(() => {
                              const isVerified = emulator.verifiedDevelopers?.some(
                                (vd) =>
                                  vd.userId === currentUserId || vd.user?.id === currentUserId,
                              )
                              const canManage = hasPermission(
                                userPermissions,
                                PERMISSIONS.MANAGE_EMULATORS,
                              )
                              return canManage && (isModeratorOrHigher || isVerified)
                            })() && (
                              <QuickEditButton
                                title={`Quick Edit Emulator ${emulator.name}`}
                                disabled={deleteEmulator.isPending || modalOpen}
                                onClick={() => openModal(emulator)}
                              />
                            )}

                            {/* Delete (Admin + Super Admin) */}
                            {canDeleteEmulators && (
                              <DeleteButton
                                onClick={() => handleDelete(emulator.id)}
                                title={`Delete Emulator ${emulator.name}`}
                                isLoading={deleteEmulator.isPending}
                                disabled={deleteEmulator.isPending}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {modalOpen && (
        <EmulatorModal
          editId={editId}
          emulatorName={emulatorName}
          onClose={closeModal}
          onSuccess={() => {
            utils.emulators.getForAdmin.invalidate().catch(console.error)
            utils.emulators.stats.invalidate().catch(console.error)
            closeModal()
          }}
        />
      )}
    </AdminPageLayout>
  )
}

export default AdminEmulatorsPage

// Reusable URL indicator cell with tooltip + copy-on-click
function UrlIndicator(props: { url?: string | null; label: string }) {
  const isPresent = Boolean(props.url)
  const title = isPresent ? (props.url as string) : 'No URL'
  const Icon = isPresent ? LinkIcon : UnlinkIcon

  return (
    <div className="inline-flex">
      <TableButton
        title={title}
        icon={Icon}
        color={isPresent ? 'blue' : 'gray'}
        disabled={!isPresent}
        onClick={() => {
          if (props.url) copyToClipboard(props.url, props.label)
        }}
      />
    </div>
  )
}
