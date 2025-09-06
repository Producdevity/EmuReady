export function GameDetailsPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4"
      role="status"
      aria-busy="true"
    >
      <div className="max-w-6xl mx-auto animate-pulse">
        {/* Back button */}
        <div className="mb-4 md:mb-6">
          <div className="h-8 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Game header card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image placeholder */}
            <div className="w-full md:w-1/4 md:min-w-[300px] md:flex-none flex-shrink-0">
              <div className="w-full h-64 md:h-[400px] rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Content placeholder */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-3">
                  <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-56 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-9 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Handheld listings table skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Device', 'Emulator', 'Performance', 'Author', 'Comments', 'Actions'].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(3)].map((_, r) => (
                  <tr key={r} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Device */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Emulator */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Performance */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Author */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Comments */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PC listings table skeleton */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Performance', 'Author', 'Comments', 'Created', 'Actions'].map((label) => (
                    <th
                      key={label}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(3)].map((_, r) => (
                  <tr key={r} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Performance */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Author */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Comments */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Created */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
