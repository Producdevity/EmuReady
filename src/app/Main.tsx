'use client'

import { type PropsWithChildren, type ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ui'

const handleError = (error: Error, info: ErrorInfo) => {
  // TODO: Log error to an error tracking service
  console.error('ErrorBoundary caught an error', error, info)
}

function Main(props: PropsWithChildren) {
  return (
    <main className="flex-1 flex flex-col">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={(details) => {
          console.error('ErrorBoundary reset', details)
          // TODO: Log reset event to an error tracking service
          // TODO: Reset any state in your app that caused the error instead of reloading
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
