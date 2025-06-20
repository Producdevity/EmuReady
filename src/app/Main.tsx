'use client'

import { usePathname } from 'next/navigation'
import { type PropsWithChildren, type ErrorInfo } from 'react'
import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ui'
import analytics from '@/lib/analytics'

function Main(props: PropsWithChildren) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  const handleError: ErrorBoundaryProps['onError'] = (
    error: Error,
    info: ErrorInfo,
  ) => {
    // TODO: Log error to a proper error tracking service
    analytics.performance.errorOccurred({
      errorType: error?.name || 'UNKNOWN',
      errorMessage: error?.message || 'No message provided',
      page: pathname || 'unknown',
    })

    console.error('ErrorBoundary caught an error', error, info)
  }

  const handleReset: ErrorBoundaryProps['onReset'] = (details) => {
    // TODO: Log error to a proper error tracking service
    analytics.performance.errorOccurred({
      errorType: 'error-boundary-reset',
      errorMessage: 'ErrorBoundary reset',
      page: pathname || 'unknown',
      reason: details.reason,
    })
    console.error('ErrorBoundary reset', details)
    // TODO: Reset any application state if that caused the error instead of reloading
    window.location.reload()
  }

  return (
    <main className={`flex-1 flex flex-col ${isHomePage ? '' : 'pt-20'}`}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={handleReset}
        onError={handleError}
      >
        {props.children}
      </ErrorBoundary>
    </main>
  )
}

export default Main
