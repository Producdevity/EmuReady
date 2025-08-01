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
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import PerformanceScaleModal from './components/PerformanceScaleModal'
import ReplacementSelectionModal from './components/ReplacementSelectionModal'
import {
  type PerformanceScale,
  type PerformanceModalState,
  type ReplacementModalState,
} from './types'

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

  const [performanceModal, setPerformanceModal] =
    useState<PerformanceModalState>({ isOpen: false })

  const [replacementModal, setReplacementModal] =
    useState<ReplacementModalState>({
      isOpen: false,
      scaleToDelete: null,
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

  const handleCreate = () => {
    setPerformanceModal({ isOpen: true })
  }

  const handleEdit = (scale: PerformanceScale) => {
    setPerformanceModal({ isOpen: true, scale })
  }

  const handleDelete = async (scale: PerformanceScale) => {
    const confirmed = await confirm({
      title: 'Delete Performance Scale',
      description: `Are you sure you want to delete "${scale.label}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    // Try to delete directly first
    deletePerformanceScale.mutate({
      id: scale.id,
    } satisfies RouterInput['performanceScales']['delete'])
  }

  if (performanceScalesQuery.isPending) return <LoadingSpinner />

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
          <Button onClick={handleCreate}>Add Performance Scale</Button>
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total Scales',
            value: performanceStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'Used in Listings',
            value: performanceStatsQuery.data?.usedInListings,
            color: 'green',
          },
          {
            label: 'Unused',
            value: performanceStatsQuery.data?.unused,
            color: 'gray',
          },
        ]}
        isLoading={performanceStatsQuery.isPending}
      />

      <AdminSearchFilters<PerformanceScaleSortField>
        table={table}
        searchPlaceholder="Search performance scales by name or description..."
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
                            onClick={() => handleEdit(scale)}
                            title="Edit Performance Scale"
                          />
                          <DeleteButton
                            onClick={() => handleDelete(scale)}
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

      <PerformanceScaleModal
        isOpen={performanceModal.isOpen}
        onClose={() => setPerformanceModal({ isOpen: false })}
        editId={performanceModal.scale?.id || null}
        scale={performanceModal.scale}
        onSuccess={() => {
          setPerformanceModal({ isOpen: false })
          utils.performanceScales.get.invalidate().catch(console.error)
          utils.performanceScales.getStats.invalidate().catch(console.error)
        }}
      />

      <ReplacementSelectionModal
        isOpen={replacementModal.isOpen}
        onClose={() =>
          setReplacementModal({ isOpen: false, scaleToDelete: null })
        }
        scaleToDelete={replacementModal.scaleToDelete}
        onSuccess={() => {
          setReplacementModal({ isOpen: false, scaleToDelete: null })
          utils.performanceScales.get.invalidate().catch(console.error)
          utils.performanceScales.getStats.invalidate().catch(console.error)
          toast.success('Performance scale deleted successfully!')
        }}
      />
    </AdminPageLayout>
  )
}

export default AdminPerformancePage
