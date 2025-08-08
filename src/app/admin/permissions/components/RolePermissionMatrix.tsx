'use client'

import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { Role } from '@orm'

interface Props {
  onSuccess: () => void
}

export default function RolePermissionMatrix(props: Props) {
  const matrixQuery = api.permissions.getPermissionMatrix.useQuery()
  const assignPermission = api.permissions.assignPermissionToRole.useMutation({
    onSuccess: () => {
      toast.success('Permission assigned successfully!')
      props.onSuccess()
    },
    onError: (err) => {
      toast.error(`Failed to assign permission: ${getErrorMessage(err)}`)
    },
  })

  const removePermission = api.permissions.removePermissionFromRole.useMutation({
    onSuccess: () => {
      toast.success('Permission removed successfully!')
      props.onSuccess()
    },
    onError: (err) => {
      toast.error(`Failed to remove permission: ${getErrorMessage(err)}`)
    },
  })

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

  if (matrixQuery.isPending) return <LoadingSpinner />

  if (!matrixQuery.data) return null

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
              {matrixQuery.data.roles.map((role) => (
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
            {matrixQuery.data.permissions.map((permission) => (
              <tr key={permission.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{permission.key}</div>
                  </div>
                </td>
                {matrixQuery.data.roles.map((role) => (
                  <td key={role} className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={permission.roles[role]}
                      onChange={() =>
                        handleTogglePermission(role, permission.id, permission.roles[role])
                      }
                      disabled={permission.isSystem && role === Role.SUPER_ADMIN}
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
