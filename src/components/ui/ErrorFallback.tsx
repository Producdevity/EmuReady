'use client'

interface Props {
  error: Error | null
  resetErrorBoundary: () => void
}

function ErrorFallback(props: Props) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        {props.error?.message ?? 'An unexpected error occurred'}
      </p>
      <button
        onClick={props.resetErrorBoundary}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
      >
        Please try again
      </button>
    </div>
  )
}

export default ErrorFallback
