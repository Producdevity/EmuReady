'use client'

import { usePathname } from 'next/navigation'
import { type PropsWithChildren, type ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ui'
import analytics from '@/lib/analytics'

function Main(props: PropsWithChildren) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  const handleError = (error: Error, info: ErrorInfo) => {
    analytics.performance.errorOccurred({
      errorType: error?.name || 'UNKNOWN',
      errorMessage: error?.message || 'No message provided',
      page: pathname || 'unknown',
    })

    // TODO: Log error to a proper error tracking service
    console.error('ErrorBoundary caught an error', error, info)
  }

  return (
    <main className={`flex-1 flex flex-col ${isHomePage ? '' : 'pt-20'}`}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={(details) => {
          console.error('ErrorBoundary reset', details)
          // TODO: Log reset event to an error tracking service
          // TODO: Reset any application state if that caused the error
          window.location.reload()
        }}
        onError={handleError}
      >
        {props.children}
      </ErrorBoundary>
    </main>
  )
}

export default Main
