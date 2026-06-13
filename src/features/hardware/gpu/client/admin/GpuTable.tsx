'use client'

import { Gpu } from 'lucide-react'
import { AdminTableNoResults } from '@/components/admin'
import { Badge, DeleteButton, EditButton, SortableHeader, ViewButton } from '@/components/ui'
import type { GpuDetail } from '../../shared/gpu.types'

interface Props {
  gpus: GpuDetail[]
  hasQuery: boolean
  canManageDevices: boolean
  isDeleting: boolean
  columnVisibility: {
    isColumnVisible: (key: string) => boolean
  }
  sortField: string | null
  sortDirection: 'asc' | 'desc' | null
  onSort: (field: string) => void
  onView: (gpu: GpuDetail) => void
  onEdit: (gpu: GpuDetail) => void
  onDelete: (id: string) => void
}

export function GpuTable(props: Props) {
  if (props.gpus.length === 0) {
    return <AdminTableNoResults icon={Gpu} hasQuery={props.hasQuery} />
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          {props.columnVisibility.isColumnVisible('brand') && (
            <SortableHeader
              label="Brand"
              field="brand"
              currentSortField={props.sortField}
              currentSortDirection={props.sortDirection}
              onSort={props.onSort}
            />
          )}
          {props.columnVisibility.isColumnVisible('model') && (
            <SortableHeader
              label="Model"
              field="modelName"
              currentSortField={props.sortField}
              currentSortDirection={props.sortDirection}
              onSort={props.onSort}
            />
          )}
          {props.columnVisibility.isColumnVisible('listings') && (
            <SortableHeader
              label="PC Reports"
              field="pcListings"
              currentSortField={props.sortField}
              currentSortDirection={props.sortDirection}
              onSort={props.onSort}
            />
          )}
          {props.columnVisibility.isColumnVisible('actions') && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {props.gpus.map((gpu) => (
          <tr key={gpu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            {props.columnVisibility.isColumnVisible('brand') && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {gpu.brand.name}
              </td>
            )}
            {props.columnVisibility.isColumnVisible('model') && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {gpu.modelName}
              </td>
            )}
            {props.columnVisibility.isColumnVisible('listings') && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <Badge>{gpu.pcListingCount}</Badge>
              </td>
            )}
            {props.columnVisibility.isColumnVisible('actions') && (
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <ViewButton onClick={() => props.onView(gpu)} title="View GPU Details" />
                  {props.canManageDevices && (
                    <EditButton onClick={() => props.onEdit(gpu)} title="Edit GPU" />
                  )}
                  {props.canManageDevices && (
                    <DeleteButton
                      onClick={() => props.onDelete(gpu.id)}
                      title="Delete GPU"
                      isLoading={props.isDeleting}
                    />
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
