'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import storageKeys from '@/data/storageKeys'
import { ColumnVisibilityControl, Input, Button, LoadingSpinner } from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'

const PERFORMANCE_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: true },
  { key: 'label', label: 'Performance Level', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'rank', label: 'Rank', defaultVisible: true },
]

function AdminPerformancePage() {
  const [search, setSearch] = useState('')

  const columnVisibility = useColumnVisibility(PERFORMANCE_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPerformance,
  })

  const { data: performanceScales, isLoading } = api.performanceScales.get.useQuery()

  // Filter performance scales based on search
  const filteredPerformanceScales = performanceScales?.filter((scale) =>
    scale.label.toLowerCase().includes(search.toLowerCase()) ||
    (scale.description && scale.description.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  const clearFilters = () => {
    setSearch('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Performance Scale Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Performance rating scales for game compatibility
          </p>
        </div>
        <ColumnVisibilityControl
          columns={PERFORMANCE_COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search performance scales by name or description..."
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            className="w-full"
          />
        </div>
        {search && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading && <LoadingSpinner text="Loading performance scales..." />}

      {!isLoading && filteredPerformanceScales.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {search ? 'No performance scales match your search criteria.' : 'No performance scales found.'}
          </p>
        </div>
      )}

      {!isLoading && filteredPerformanceScales.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('id') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                )}
                {columnVisibility.isColumnVisible('label') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance Level
                  </th>
                )}
                {columnVisibility.isColumnVisible('description') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                )}
                {columnVisibility.isColumnVisible('rank') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPerformanceScales.map((scale) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPerformancePage
