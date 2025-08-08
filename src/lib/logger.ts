import * as Sentry from '@sentry/nextjs'

/**
 * Centralized logging utility that integrates with Sentry
 * Use this instead of console.log/error for better observability
 */

const { logger } = Sentry

export const log = {
  /**
   * Log debug information (only in development)
   */
  debug: (message: string, extra?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, extra)
    }
    logger.debug(message, extra)
  },

  /**
   * Log general information
   */
  info: (message: string, extra?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, extra)
    logger.info(message, extra)
  },

  /**
   * Log warnings
   */
  warn: (message: string, extra?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, extra)
    logger.warn(message, extra)
  },

  /**
   * Log errors and capture them in Sentry
   */
  error: (
    message: string,
    error?: Error | unknown,
    extra?: Record<string, unknown>,
  ) => {
    console.error(`[ERROR] ${message}`, error, extra)

    if (error instanceof Error) {
      Sentry.withScope((scope) => {
        if (extra) {
          scope.setContext('errorContext', extra)
        }
        scope.setLevel('error')
        Sentry.captureException(error, {
          tags: {
            errorMessage: message,
          },
        })
      })
    } else {
      logger.error(message, {
        ...extra,
        error: error ? String(error) : undefined,
      })
    }
  },

  /**
   * Log fatal errors (system-critical issues)
   */
  fatal: (
    message: string,
    error?: Error | unknown,
    extra?: Record<string, unknown>,
  ) => {
    console.error(`[FATAL] ${message}`, error, extra)

    if (error instanceof Error) {
      Sentry.withScope((scope) => {
        if (extra) {
          scope.setContext('fatalContext', extra)
        }
        scope.setLevel('fatal')
        Sentry.captureException(error, {
          tags: {
            fatalError: true,
            errorMessage: message,
          },
        })
      })
    } else {
      logger.fatal(message, {
        ...extra,
        error: error ? String(error) : undefined,
      })
    }
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
