'use client'

import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
} from '@/components/admin'
import {
  Button,
  ColumnVisibilityControl,
  DeleteButton,
  EditButton,
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
  Badge,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { Role } from '@orm'

type PermissionSortField =
  | 'label'
  | 'key'
  | 'category'
  | 'createdAt'
  | 'updatedAt'

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
  { value: 'CONTENT', label: 'Content Management' },
  { value: 'MODERATION', label: 'Moderation' },
  { value: 'USER_MANAGEMENT', label: 'User Management' },
  { value: 'SYSTEM', label: 'System' },
] as const

function PermissionModal({
  permission: _permission,
  isOpen: _isOpen,
  onClose: _onClose,
  onSuccess: _onSuccess,
}: {
  permission?: Record<string, unknown>
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  // TODO: Implement permission create/edit modal
  // This would include form fields for key, label, description, category
  return null
}

function RolePermissionMatrix({ onSuccess }: { onSuccess: () => void }) {
  const matrixQuery = api.permissions.getPermissionMatrix.useQuery()
  const assignPermission = api.permissions.assignPermissionToRole.useMutation({
    onSuccess: () => {
      toast.success('Permission assigned successfully!')
      onSuccess()
    },
    onError: (err) => {
      toast.error(`Failed to assign permission: ${getErrorMessage(err)}`)
    },
  })

  const removePermission = api.permissions.removePermissionFromRole.useMutation(
    {
      onSuccess: () => {
        toast.success('Permission removed successfully!')
        onSuccess()
      },
      onError: (err) => {
        toast.error(`Failed to remove permission: ${getErrorMessage(err)}`)
      },
    },
  )

  const handleTogglePermission = async (
    role: Role,
    permissionId: string,
    hasPermission: boolean,
  ) => {
    if (hasPermission) {
      await removePermission.mutateAsync({ role, permissionId })
    } else {
      await assignPermission.mutateAsync({ role, permissionId })
    }
  }

  if (matrixQuery.isLoading) {
    return <LoadingSpinner />
  }

  const matrix = matrixQuery.data
  if (!matrix) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Role Permission Matrix
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Permission
              </th>
              {matrix.roles.map((role) => (
                <th
                  key={role}
                  className="px-4 py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.permissions.map((permission) => (
              <tr
                key={permission.id}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <td className="px-4 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {permission.key}
                    </div>
                  </div>
                </td>
                {matrix.roles.map((role) => (
                  <td key={role} className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={permission.roles[role]}
                      onChange={() =>
                        handleTogglePermission(
                          role,
                          permission.id,
                          permission.roles[role],
                        )
                      }
                      disabled={
                        permission.isSystem && role === Role.SUPER_ADMIN
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminPermissionsPage() {
  const table = useAdminTable<PermissionSortField>({ defaultLimit: 50 })
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showMatrix, setShowMatrix] = useState(false)
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean
    permission?: Record<string, unknown>
  }>({ isOpen: false })

  const columnVisibility = useColumnVisibility(PERMISSION_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPermissions,
  })

  // Get permissions stats
  const permissionsQuery = api.permissions.getAll.useQuery({
    search: table.debouncedSearch || undefined,
    category:
      (selectedCategory as
        | 'CONTENT'
        | 'MODERATION'
        | 'USER_MANAGEMENT'
        | 'SYSTEM') || undefined,
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
      utils.permissions.getAll.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete permission: ${getErrorMessage(err)}`)
    },
  })

  const handleEdit = (permission: Record<string, unknown>) => {
    setPermissionModal({ isOpen: true, permission })
  }

  const handleCreate = () => {
    setPermissionModal({ isOpen: true })
  }

  const handleDelete = async (permission: Record<string, unknown>) => {
    const confirmed = await confirm({
      title: 'Delete Permission',
      description: `Are you sure you want to delete the permission "${permission.label as string}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    deletePermission.mutate({
      id: permission.id as string,
    } satisfies RouterInput['permissions']['delete'])
  }

  const handleModalSuccess = () => {
    setPermissionModal({ isOpen: false })
    utils.permissions.getAll.invalidate().catch(console.error)
  }

  const statsData = permissionsQuery.data
    ? [
        {
          label: 'Total Permissions',
          value: pagination?.total || 0,
          color: 'blue' as const,
        },
        {
          label: 'System Permissions',
          value: permissions.filter((p) => p.isSystem).length,
          color: 'green' as const,
        },
        {
          label: 'Custom Permissions',
          value: permissions.filter((p) => !p.isSystem).length,
          color: 'purple' as const,
        },
      ]
    : []

  if (permissionsQuery.isLoading) return <LoadingSpinner />

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
          <Button onClick={handleCreate}>Add Permission</Button>
        </>
      }
    >
      <AdminStatsDisplay
        stats={statsData}
        isLoading={permissionsQuery.isLoading}
      />

      {showMatrix && (
        <RolePermissionMatrix
          onSuccess={() => {
            utils.permissions.getAll.invalidate().catch(console.error)
          }}
        />
      )}

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Search permissions by key, label, or description..."
        onClear={table.search ? () => table.setSearch('') : undefined}
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
        {permissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || selectedCategory
                ? 'No permissions found matching your criteria.'
                : 'No permissions found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
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
                        {permission.id.slice(0, 8)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('key') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {permission.key}
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
                          <Badge>{permission.category}</Badge>
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('roles') && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {permission.assignedRoles.map((role: Role) => (
                            <Badge key={role}>{role}</Badge>
                          ))}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('isSystem') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {permission.isSystem && <Badge>System</Badge>}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton
                            onClick={() => handleEdit(permission)}
                            title="Edit Permission"
                          />
                          {!permission.isSystem && (
                            <DeleteButton
                              onClick={() => handleDelete(permission)}
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
          </div>
        )}
      </AdminTableContainer>

      {/* TODO: Add pagination component */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total}{' '}
            total)
          </div>
        </div>
      )}

      <PermissionModal
        permission={permissionModal.permission}
        isOpen={permissionModal.isOpen}
        onClose={() => setPermissionModal({ isOpen: false })}
        onSuccess={handleModalSuccess}
      />
    </AdminPageLayout>
  )
}

export default AdminPermissionsPage
