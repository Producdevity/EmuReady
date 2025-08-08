'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface Props {
  error: Error | null
  resetErrorBoundary: () => void
}

export function ErrorFallback(props: Props) {
  useEffect(() => {
    // Report error view to Sentry when the fallback is shown
    if (props.error) {
      Sentry.captureMessage('Error fallback UI displayed', {
        level: 'warning',
        tags: { 'ui.error.fallback': true },
        extra: {
          errorMessage: props.error.message,
          errorName: props.error.name,
        },
      })
    }
  }, [props.error])

  const handleRetry = () => {
    // Track retry attempt in Sentry
    Sentry.captureMessage('User attempted error recovery', {
      level: 'info',
      tags: { 'ui.error.retry': true },
      extra: { errorMessage: props.error?.message },
    })

    props.resetErrorBoundary()
  }

  return (
    <div className="m-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        {props.error?.message ?? 'An unexpected error occurred'}
      </p>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
      >
        Please try again
      </button>
    </div>
  )
}
