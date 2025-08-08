'use client'

import * as Sentry from '@sentry/nextjs'
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
    // Log to analytics for tracking
    analytics.performance.errorOccurred({
      errorType: error?.name || 'UNKNOWN',
      errorMessage: error?.message || 'No message provided',
      page: pathname || 'unknown',
    })

    // Capture error in Sentry with context
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        pathname,
        componentStack: info.componentStack,
      })
      scope.setTag('error.boundary', true)
      scope.setLevel('error')
      Sentry.captureException(error)
    })

    console.error('[ErrorBoundary]: ', error, info)
  }

  const handleReset: ErrorBoundaryProps['onReset'] = (details) => {
    // Log to analytics
    analytics.performance.errorOccurred({
      errorType: 'error-boundary-reset',
      errorMessage: 'ErrorBoundary reset',
      page: pathname || 'unknown',
      reason: details.reason,
    })

    // Log reset event to Sentry
    Sentry.captureMessage('Error boundary was reset', {
      level: 'info',
      tags: { 'error.boundary.reset': true, pathname },
      extra: { reason: details.reason },
    })

    console.error('ErrorBoundary reset', details)
    // Reset by reloading the page
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
