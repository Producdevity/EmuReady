export function PageSkeletonLoading() {
  return (
    <div
      className="container mx-auto px-4 py-12"
      role="status"
      aria-busy="true"
    >
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      </div>
    </div>
  )
}
