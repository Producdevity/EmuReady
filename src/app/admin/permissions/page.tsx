'use client'

import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import { BooleanIcon } from '@/components/icons'
import {
  Button,
  ColumnVisibilityControl,
  DeleteButton,
  EditButton,
  LoadingSpinner,
  Pagination,
  SortableHeader,
  useConfirmDialog,
  Badge,
  Code,
  LocalizedDate,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { RolePermissionMatrix } from '@/lib/dynamic-imports'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import { getPermissionCategoryBadgeVariant, getRoleVariant } from '@/utils/badge-colors'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { PermissionCategory } from '@orm'
import PermissionModal from './components/PermissionModal'

type PermissionSortField = 'label' | 'key' | 'category' | 'createdAt' | 'updatedAt'

const PERMISSION_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'key', label: 'Permission Key', defaultVisible: true },
  { key: 'label', label: 'Label', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'roles', label: 'Assigned Roles', defaultVisible: true },
  { key: 'isSystem', label: 'System Permission', defaultVisible: false },
  { key: 'createdAt', label: 'Created', defaultVisible: false },
  { key: 'actions', label: 'Actions', defaultVisible: true },
]

const PERMISSION_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: PermissionCategory.CONTENT, label: 'Content Management' },
  { value: PermissionCategory.MODERATION, label: 'Moderation' },
  { value: PermissionCategory.USER_MANAGEMENT, label: 'User Management' },
  { value: PermissionCategory.SYSTEM, label: 'System' },
] as const

function AdminPermissionsPage() {
  const table = useAdminTable<PermissionSortField>({ defaultLimit: 50 })
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showMatrix, setShowMatrix] = useState(false)
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean
    permission?: {
      id: string
      key: string
      label: string
      description?: string | null
      category?: PermissionCategory | null
    } | null
  }>({ isOpen: false, permission: null })

  const columnVisibility = useColumnVisibility(PERMISSION_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPermissions,
  })

  // Get permissions stats
  const permissionsQuery = api.permissions.get.useQuery({
    search: table.debouncedSearch || undefined,
    category: (selectedCategory as PermissionCategory) || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const permissions = permissionsQuery.data?.permissions ?? []
  const pagination = permissionsQuery.data?.pagination

  const deletePermission = api.permissions.delete.useMutation({
    onSuccess: () => {
      toast.success('Permission deleted successfully!')
      utils.permissions.get.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete permission: ${getErrorMessage(err)}`)
    },
  })

  const handleEdit = (permission: {
    id: string
    key: string
    label: string
    description?: string | null
    category?: PermissionCategory | null
  }) => {
    setPermissionModal({ isOpen: true, permission })
  }

  const handleCreate = () => {
    setPermissionModal({ isOpen: true, permission: null })
  }

  const handleDelete = async (permission: {
    id: string
    key: string
    label: string
    description?: string | null
    category?: PermissionCategory | null
  }) => {
    const confirmed = await confirm({
      title: 'Delete Permission',
      description: `Are you sure you want to delete the permission "${permission.label}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    deletePermission.mutate({
      id: permission.id,
    } satisfies RouterInput['permissions']['delete'])
  }

  const handleModalSuccess = () => {
    setPermissionModal({ isOpen: false, permission: null })
    utils.permissions.get.invalidate().catch(console.error)
  }

  const userQuery = api.users.me.useQuery()
  const canManagePermissions = hasPermission(
    userQuery.data?.permissions,
    PERMISSIONS.MANAGE_PERMISSIONS,
  )

  return (
    <AdminPageLayout
      title="Permission Management"
      description="Manage roles, permissions, and access control"
      headerActions={
        <>
          <Button
            variant={showMatrix ? 'default' : 'outline'}
            onClick={() => setShowMatrix(!showMatrix)}
          >
            {showMatrix ? 'Hide Matrix' : 'Show Matrix'}
          </Button>
          <ColumnVisibilityControl
            columns={PERMISSION_COLUMNS}
            columnVisibility={columnVisibility}
          />
          {canManagePermissions && <Button onClick={handleCreate}>Add Permission</Button>}
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total Permissions',
            value: pagination?.total || 0,
            color: 'blue',
          },
          {
            label: 'System Permissions',
            value: permissions?.filter((p) => p.isSystem).length,
            color: 'green',
          },
          {
            label: 'Custom Permissions',
            value: permissions?.filter((p) => !p.isSystem).length,
            color: 'purple',
          },
        ]}
        isLoading={permissionsQuery.isPending}
      />

      {showMatrix && (
        <RolePermissionMatrix
          onSuccess={() => {
            utils.permissions.get.invalidate().catch(console.error)
          }}
        />
      )}

      <AdminSearchFilters<PermissionSortField>
        table={table}
        searchPlaceholder="Search permissions by key, label, or description..."
      >
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {PERMISSION_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {permissionsQuery.isPending ? (
          <LoadingSpinner text="Loading permissions..." />
        ) : permissions.length === 0 ? (
          <AdminTableNoResults hasQuery={!!table.search || !!selectedCategory} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columnVisibility.isColumnVisible('id') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                )}
                {columnVisibility.isColumnVisible('key') && (
                  <SortableHeader
                    label="Permission Key"
                    field="key"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('label') && (
                  <SortableHeader
                    label="Label"
                    field="label"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('description') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                )}
                {columnVisibility.isColumnVisible('category') && (
                  <SortableHeader
                    label="Category"
                    field="category"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('roles') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assigned Roles
                  </th>
                )}
                {columnVisibility.isColumnVisible('isSystem') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    System
                  </th>
                )}
                {columnVisibility.isColumnVisible('createdAt') && (
                  <SortableHeader
                    label="Created"
                    field="createdAt"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {permissions.map((permission) => (
                <tr
                  key={permission.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('id') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Code label={permission.id} maxLength={8} />
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('key') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900 dark:text-white">
                      <Code label={permission.key} value={permission.key} />
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('label') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {permission.label}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('description') && (
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {permission.description || '-'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('category') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {permission.category && (
                        <Badge variant={getPermissionCategoryBadgeVariant(permission.category)}>
                          {permission.category}
                        </Badge>
                      )}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('roles') && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {permission.assignedRoles.map((role) => (
                          <Badge key={role} variant={getRoleVariant(role)}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('isSystem') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <BooleanIcon value={permission.isSystem} />
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('createdAt') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <LocalizedDate date={permission.createdAt} format="date" />
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManagePermissions && (
                          <EditButton
                            onClick={() =>
                              handleEdit({ ...permission, category: permission.category })
                            }
                            title="Edit Permission"
                          />
                        )}
                        {canManagePermissions && !permission.isSystem && (
                          <DeleteButton
                            onClick={() =>
                              handleDelete({ ...permission, category: permission.category })
                            }
                            title="Delete Permission"
                            isLoading={deletePermission.isPending}
                            disabled={deletePermission.isPending}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          onPageChange={table.setPage}
        />
      )}

      <PermissionModal
        permission={permissionModal.permission || undefined}
        isOpen={permissionModal.isOpen}
        onClose={() => setPermissionModal({ isOpen: false, permission: null })}
        onSuccess={handleModalSuccess}
      />
    </AdminPageLayout>
  )
}

export default AdminPermissionsPage
