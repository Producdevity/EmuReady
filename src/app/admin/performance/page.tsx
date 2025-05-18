'use client'

import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui'

function AdminPerformancePage() {
  const { data: scales, isLoading } = api.listings.performanceScales.useQuery()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Performance Scales</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Label
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Rank
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={2} className="text-center py-8">
                  <LoadingSpinner />
                </td>
              </tr>
            )}
            {scales?.map(
              (scale: { id: number; label: string; rank: number }) => (
                <tr
                  key={scale.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-2">{scale.label}</td>
                  <td className="px-4 py-2">{scale.rank}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPerformancePage
