'use client'

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
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type PerformanceScaleSortField = 'label' | 'rank'

const PERFORMANCE_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'label', label: 'Performance Level', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'rank', label: 'Rank', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true },
]

function AdminPerformancePage() {
  const table = useAdminTable<PerformanceScaleSortField>({ defaultLimit: 20 })
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const columnVisibility = useColumnVisibility(PERFORMANCE_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPerformance,
  })

  const performanceStatsQuery = api.performanceScales.getStats.useQuery()
  const performanceScalesQuery = api.performanceScales.get.useQuery({
    search: table.search || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })

  const performanceScales = performanceScalesQuery.data ?? []

  const deletePerformanceScale = api.performanceScales.delete.useMutation({
    onSuccess: () => {
      toast.success('Performance scale deleted successfully!')
      utils.performanceScales.get.invalidate().catch(console.error)
      utils.performanceScales.getStats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete performance scale: ${getErrorMessage(err)}`)
    },
  })

  const openModal = (_scale?: { id: number }) => {
    // TODO: Implement modal functionality to edit performance scale
    console.log('Open modal for editing performance scale')
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Performance Scale',
      description:
        'Are you sure you want to delete this performance scale? This action cannot be undone.',
    })

    if (!confirmed) return

    // TODO: add a way to select a performance scale that all the listings using this performance scale will be updated to
    deletePerformanceScale.mutate({
      id,
    } satisfies RouterInput['performanceScales']['delete'])
  }

  if (performanceScalesQuery.isLoading) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="Performance Scale Management"
      description="Performance rating scales for game compatibility"
      headerActions={
        <>
          <ColumnVisibilityControl
            columns={PERFORMANCE_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Performance Scale</Button>
        </>
      }
    >
      {performanceStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total Scales',
              value: performanceStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'Used in Listings',
              value: performanceStatsQuery.data.usedInListings,
              color: 'green',
            },
            {
              label: 'Unused',
              value: performanceStatsQuery.data.unused,
              color: 'gray',
            },
          ]}
          isLoading={performanceStatsQuery.isLoading}
        />
      )}

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Search performance scales by name or description..."
        onClear={table.search ? () => table.setSearch('') : undefined}
      />

      <AdminTableContainer>
        {performanceScales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search
                ? 'No performance scales found matching your search.'
                : 'No performance scales found.'}
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
                  {columnVisibility.isColumnVisible('label') && (
                    <SortableHeader
                      label="Performance Level"
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
                  {columnVisibility.isColumnVisible('rank') && (
                    <SortableHeader
                      label="Rank"
                      field="rank"
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
                {performanceScales.map((scale) => (
                  <tr
                    key={scale.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('id') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {scale.id}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('label') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {scale.label}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('description') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {scale.description}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('rank') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {scale.rank}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditButton
                            onClick={() => openModal(scale)}
                            title="Edit Performance Scale"
                          />
                          <DeleteButton
                            onClick={() => handleDelete(scale.id)}
                            title="Delete Performance Scale"
                            isLoading={deletePerformanceScale.isPending}
                            disabled={deletePerformanceScale.isPending}
                          />
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
    </AdminPageLayout>
  )
}

export default AdminPerformancePage
