// Centralized error handling utilities
// Consolidates toast notification patterns and error formatting

import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

// Define proper entity types based on the codebase
export type EntityType =
  | 'deviceBrand'
  | 'device'
  | 'system'
  | 'game'
  | 'emulator'
  | 'listing'
  | 'customField'
  | 'customFieldTemplate'
  | 'performanceScale'
  | 'user'
  | 'comment'

export type CrudOperation = 'create' | 'update' | 'delete' | 'fetch'

/**
 * Standard error handling for CRUD operations
 * Provides consistent success/error messaging
 */
export interface CrudErrorOptions {
  entity: EntityType
  operation: CrudOperation
  additionalContext?: string
}

/**
 * Standard success toast for CRUD operations
 */
export function showCrudSuccess(options: CrudErrorOptions): void {
  const { entity, operation } = options

  const operationMessages: Record<CrudOperation, string> = {
    create: `${getEntityDisplayName(entity)} created successfully`,
    update: `${getEntityDisplayName(entity)} updated successfully`,
    delete: `${getEntityDisplayName(entity)} deleted successfully`,
    fetch: `${getEntityDisplayName(entity)} loaded successfully`,
  }

  const message = operationMessages[operation]
  toast.success(message)
}

/**
 * Standard error toast for CRUD operations
 */
export function showCrudError(error: unknown, options: CrudErrorOptions): void {
  const { entity, operation, additionalContext } = options

  const errorMessage = getErrorMessage(error)
  const operationVerb = getOperationVerb(operation)

  let message = `Failed to ${operationVerb} ${getEntityDisplayName(entity).toLowerCase()}`
  if (additionalContext) {
    message += ` ${additionalContext}`
  }

  // If the error message is user-friendly (not technical), show it directly
  if (isUserFriendlyError(errorMessage)) {
    toast.error(errorMessage)
  } else {
    // Show generic message with additional context
    toast.error(`${message}. Please try again.`)
  }
}

/**
 * Get user-friendly display name for entity
 */
function getEntityDisplayName(entity: EntityType): string {
  const displayNames: Record<EntityType, string> = {
    deviceBrand: 'Device Brand',
    device: 'Device',
    system: 'System',
    game: 'Game',
    emulator: 'Emulator',
    listing: 'Listing',
    customField: 'Custom Field',
    customFieldTemplate: 'Custom Field Template',
    performanceScale: 'Performance Scale',
    user: 'User',
    comment: 'Comment',
  }

  return displayNames[entity]
}

/**
 * Get operation verb for display
 */
function getOperationVerb(operation: CrudOperation): string {
  const verbs: Record<CrudOperation, string> = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    fetch: 'load',
  }

  return verbs[operation]
}

/**
 * Check if error message is user-friendly (not technical)
 * User-friendly errors from backend should be shown directly
 */
function isUserFriendlyError(message: string): boolean {
  // Technical error patterns that should be hidden from users
  const technicalPatterns = [
    /database/i,
    /prisma/i,
    /sql/i,
    /connection/i,
    /timeout/i,
    /internal server error/i,
    /unexpected error/i,
    /stack trace/i,
    /error code/i,
    /fetch failed/i,
    /network error/i,
  ]

  return !technicalPatterns.some((pattern) => pattern.test(message))
}

/**
 * Creates a standardized error handler for React Query mutations
 * Automatically shows error toasts and logs errors
 */
export function createMutationErrorHandler(options: CrudErrorOptions) {
  return (error: unknown) => {
    showCrudError(error, options)
    console.error(`Error ${options.operation}ing ${options.entity}:`, error)
  }
}

/**
 * Standard error handler for async operations with automatic toast notifications
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: CrudErrorOptions,
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      const result = await fn(...args)
      // Only show success toast for create/update/delete operations
      if (['create', 'update', 'delete'].includes(options.operation)) {
        showCrudSuccess(options)
      }
      return result
    } catch (error) {
      showCrudError(error, options)
      console.error(`Error ${options.operation}ing ${options.entity}:`, error)
      return undefined
    }
  }
}
