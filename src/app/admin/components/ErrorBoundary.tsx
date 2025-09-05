'use client'

import { AlertTriangle } from 'lucide-react'
import { Component, type ComponentType, type PropsWithChildren, type ErrorInfo } from 'react'
import { logger } from '@/lib/logger'

interface Props extends PropsWithChildren {
  fallback?: ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary]: caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError || !this.state.error) return this.props.children

    if (this.props.fallback) {
      const FallbackComponent = this.props.fallback
      return <FallbackComponent error={this.state.error} reset={this.reset} />
    }

    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Something went wrong
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.reset}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }
}
