import * as Sentry from '@sentry/nextjs'

/**
 * Centralized logging utility that integrates with Sentry
 * Use this instead of console.log/error for better observability
 */

type LogMessage = Parameters<typeof console.log>[0]
type LogExtra = Parameters<typeof console.log>[1]

export const logger = {
  /**
   * General log (only in non-production)
   */
  log: (message: LogMessage, ...extra: LogExtra) => {
    if (process.env.NODE_ENV === 'production') return
    console.log(`[LOG] ${message}`, ...extra)
  },
  /**
   * Log debug information (only in development)
   */
  debug: (message: LogMessage, extra?: LogExtra) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, extra)
    }
    Sentry.logger.debug(message, extra)
  },

  /**
   * Log general information (always)
   */
  info: (message: LogMessage, extra?: LogExtra) => {
    console.log(`[INFO] ${message}`, extra)
    Sentry.logger.info(message, extra)
  },

  /**
   * Log warnings (non-critical issues)
   */
  warn: (message: LogMessage, extra?: LogExtra) => {
    console.warn(`[WARN] ${message}`, extra)
    Sentry.logger.warn(message, extra)
  },

  /**
   * Log errors and capture them in Sentry (critical issues)
   */
  error: (message: LogMessage, error?: Error | unknown, extra?: LogExtra) => {
    console.error(`[ERROR] ${message}`, error, extra)

    if (error instanceof Error) {
      return Sentry.withScope((scope) => {
        if (extra) scope.setContext('errorContext', extra)
        scope.setLevel('error')
        Sentry.captureException(error, { tags: { errorMessage: message } })
      })
    }
    Sentry.logger.error(message, { ...extra, error: error ? String(error) : undefined })
  },

  /**
   * Log fatal errors (system-critical issues)
   */
  fatal: (message: LogMessage, error?: Error | unknown, extra?: Record<string, unknown>) => {
    console.error(`[FATAL] ${message}`, error, extra)

    if (error instanceof Error) {
      return Sentry.withScope((scope) => {
        if (extra) scope.setContext('fatalContext', extra)
        scope.setLevel('fatal')
        Sentry.captureException(error, {
          tags: {
            fatalError: true,
            errorMessage: message,
          },
        })
      })
    }
    Sentry.logger.fatal(message, { ...extra, error: error ? String(error) : undefined })
  },
}

/**
 * Create a performance span for tracking operations
 */
export function trackPerformance<T>(
  operation: {
    op: string
    name: string
    attributes?: Record<string, string | number | boolean>
  },
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return Sentry.startSpan(
    {
      op: operation.op,
      name: operation.name,
    },
    (span) => {
      if (operation.attributes) {
        Object.entries(operation.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value)
        })
      }
      return callback()
    },
  )
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: { name?: string; tags?: Record<string, string> },
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      Sentry.withScope((scope) => {
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value)
          })
        }
        scope.setContext('function', {
          name: context?.name ?? fn.name,
          args: args.length > 0 ? JSON.stringify(args) : undefined,
        })
        Sentry.captureException(error)
      })
      throw error
    }
  }
}
