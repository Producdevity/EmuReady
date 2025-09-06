'use client'

import * as Sentry from '@sentry/nextjs'
import { type PropsWithChildren, type ErrorInfo } from 'react'
import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'

function Main(props: PropsWithChildren) {
  const mounted = useMounted()
  // Avoid using pathname at render time to keep SSR/CSR markup identical
  const pathname = typeof window !== 'undefined' ? window.location.pathname : undefined

  const handleError: ErrorBoundaryProps['onError'] = (error: Error, info: ErrorInfo) => {
    analytics.performance.errorOccurred({
      errorType: error?.name || 'UNKNOWN',
      errorMessage: error?.message || 'No message provided',
      page: pathname || 'unknown',
    })

    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        pathname,
        componentStack: info.componentStack,
      })
      scope.setTag('error.boundary', true)
      scope.setLevel('error')
      Sentry.captureException(error)
    })

    console.error('[Main] ErrorBoundary', error, info)
  }

  const handleReset: ErrorBoundaryProps['onReset'] = (details) => {
    analytics.performance.errorOccurred({
      errorType: 'error-boundary-reset',
      errorMessage: 'ErrorBoundary reset',
      page: pathname || 'unknown',
      reason: details.reason,
    })

    Sentry.captureMessage('Error boundary was reset', {
      level: 'info',
      tags: { 'error.boundary.reset': true, pathname },
      extra: { reason: details.reason },
    })

    console.error('[Main] ErrorBoundary reset', details)
    if (mounted) window.location.reload()
  }

  return (
    <main className={cn('flex-1 flex flex-col')}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleReset} onError={handleError}>
        {props.children}
      </ErrorBoundary>
    </main>
  )
}

export default Main
