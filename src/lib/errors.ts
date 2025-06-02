/**
 * @documentation /docs/ERROR_HANDLING.md
 */
import { TRPCError } from '@trpc/server'

// Define error types as constants for better type safety
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// Define common error scenarios with default messages
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  FORBIDDEN: 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS: 'You do not have sufficient permissions',
  NOT_AUTHENTICATED: 'You must be logged in to perform this action',
  UNAUTHORIZED: 'You must be logged in to perform this action',

  // Resource errors
  ALREADY_EXISTS: 'A resource with this identifier already exists',
  NOT_FOUND: 'The requested resource was not found',

  // Validation errors
  INVALID_INPUT: 'The provided input is invalid',
  MISSING_REQUIRED_FIELD: 'A required field is missing',

  // Business logic errors
  OPERATION_NOT_ALLOWED: 'This operation is not allowed',
  RESOURCE_IN_USE: 'Cannot delete resource as it is currently in use',

  // System errors
  DATABASE_ERROR: 'A database error occurred',
  EXTERNAL_SERVICE_ERROR: 'An external service error occurred',
} as const

// Error factory functions for common scenarios
export class AppError {
  // Authentication & Authorization
  static notAuthenticated(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.UNAUTHORIZED,
      message: message ?? ERROR_MESSAGES.NOT_AUTHENTICATED,
    })
  }

  static unauthorized(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.UNAUTHORIZED,
      message: message ?? ERROR_MESSAGES.UNAUTHORIZED,
    })
  }

  static forbidden(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.FORBIDDEN,
      message: message ?? ERROR_MESSAGES.FORBIDDEN,
    })
  }

  static insufficientPermissions(requiredRole?: string): never {
    const message = requiredRole
      ? `You need ${requiredRole} permissions to perform this action`
      : ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS

    throw new TRPCError({ code: ERROR_CODES.FORBIDDEN, message })
  }

  // Resource errors
  static notFound(resource?: string): never {
    const message = resource
      ? `${resource} not found`
      : ERROR_MESSAGES.NOT_FOUND

    throw new TRPCError({ code: ERROR_CODES.NOT_FOUND, message })
  }

  static alreadyExists(resource?: string, identifier?: string): never {
    let message: string = ERROR_MESSAGES.ALREADY_EXISTS

    if (resource && identifier) {
      message = `${resource} with ${identifier} already exists`
    } else if (resource) {
      message = `${resource} already exists`
    }

    throw new TRPCError({ code: ERROR_CODES.CONFLICT, message })
  }

  static conflict(message: string): never {
    throw new TRPCError({ code: ERROR_CODES.CONFLICT, message })
  }

  // Validation errors
  static badRequest(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.BAD_REQUEST,
      message: message ?? ERROR_MESSAGES.INVALID_INPUT,
    })
  }

  static invalidInput(field?: string): never {
    const message = field
      ? `Invalid input for field: ${field}`
      : ERROR_MESSAGES.INVALID_INPUT

    throw new TRPCError({ code: ERROR_CODES.BAD_REQUEST, message })
  }

  static missingRequiredField(field: string): never {
    throw new TRPCError({
      code: ERROR_CODES.BAD_REQUEST,
      message: `Required field missing: ${field}`,
    })
  }

  // Business logic errors
  static resourceInUse(resource: string, count?: number): never {
    const message = count
      ? `Cannot delete ${resource} that is used in ${count} records`
      : `Cannot delete ${resource} as it is currently in use`

    throw new TRPCError({ code: ERROR_CODES.BAD_REQUEST, message })
  }

  static operationNotAllowed(operation?: string): never {
    const message = operation
      ? `Operation not allowed: ${operation}`
      : ERROR_MESSAGES.OPERATION_NOT_ALLOWED

    throw new TRPCError({ code: ERROR_CODES.BAD_REQUEST, message })
  }

  // System errors
  static internalError(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: message ?? 'An internal server error occurred',
    })
  }

  static databaseError(operation?: string): never {
    const message = operation
      ? `Database error during ${operation}`
      : ERROR_MESSAGES.DATABASE_ERROR

    throw new TRPCError({ code: ERROR_CODES.INTERNAL_SERVER_ERROR, message })
  }

  // Generic error thrower with custom code and message
  static custom(code: ErrorCode, message: string): never {
    throw new TRPCError({ code: ERROR_CODES[code], message })
  }
}

// Utility functions for common validation patterns
export class ValidationError {
  static requiresOptions(fieldType: string): never {
    AppError.badRequest(
      `Options are required for ${fieldType} type custom fields`,
    )
  }

  static optionsNotAllowed(fieldType: string): never {
    AppError.badRequest(
      `Options can only be provided for SELECT type custom fields, not ${fieldType}`,
    )
  }

  static emptyOptions(fieldType: string): never {
    AppError.badRequest(
      `Options list cannot be empty for ${fieldType} type. Provide at least one option`,
    )
  }

  static invalidOptions(fieldType: string): never {
    AppError.badRequest(
      `Existing options are invalid or empty for ${fieldType} type. Please provide new options`,
    )
  }
}

// Resource-specific error helpers
export class ResourceError {
  static deviceBrand = {
    notFound: () => AppError.notFound('Device brand'),
    alreadyExists: (name: string) =>
      AppError.alreadyExists('Brand', `"${name}"`),
    inUse: (count: number) => AppError.resourceInUse('brand', count),
  }

  static device = {
    notFound: () => AppError.notFound('Device'),
    alreadyExists: (modelName: string) =>
      AppError.conflict(
        `A device with model name "${modelName}" already exists for this brand`,
      ),
    inUse: (count: number) => AppError.resourceInUse('device', count),
  }

  static system = {
    notFound: () => AppError.notFound('System'),
    alreadyExists: (name: string) =>
      AppError.alreadyExists('System', `name "${name}"`),
    hasGames: (count: number) => AppError.resourceInUse('system', count),
  }

  static game = {
    notFound: () => AppError.notFound('Game'),
    inUse: (count: number) => AppError.resourceInUse('game', count),
    alreadyExists: (title: string, systemName: string) =>
      AppError.conflict(
        `A game titled "${title}" already exists for the system "${systemName}"`,
      ),
  }

  static emulator = {
    notFound: () => AppError.notFound('Emulator'),
    alreadyExists: (name: string) =>
      AppError.alreadyExists('Emulator', `name "${name}"`),
    inUse: (count: number) => AppError.resourceInUse('emulator', count),
  }

  static listing = {
    notFound: () => AppError.notFound('Listing'),
    alreadyExists: () =>
      AppError.conflict(
        'A listing for this game, device, and emulator combination already exists',
      ),
    notPending: () =>
      AppError.notFound('Pending listing not found or already processed'),
  }

  static customField = {
    notFound: () => AppError.notFound('Custom field'),
    alreadyExists: (name: string) =>
      AppError.conflict(
        `A custom field with name "${name}" already exists for this emulator`,
      ),
    invalidForEmulator: (fieldId: string, emulatorId: string) =>
      AppError.badRequest(
        `Invalid custom field definition ID: ${fieldId} for emulator ${emulatorId}`,
      ),
  }

  static performanceScale = {
    notFound: () => AppError.notFound('Performance scale'),
    labelExists: (label: string) =>
      AppError.alreadyExists('Performance scale', `label "${label}"`),
    rankExists: (rank: number) =>
      AppError.alreadyExists('Performance scale', `rank ${rank}`),
    inUse: (count: number) =>
      AppError.resourceInUse('performance scale', count),
  }

  static user = {
    notFound: () => AppError.notFound('User'),
    emailExists: () => AppError.alreadyExists('User', 'this email'),
    invalidPassword: () =>
      AppError.custom('UNAUTHORIZED', 'Current password is incorrect'),
    cannotDeleteSelf: () =>
      AppError.forbidden('You cannot delete your own account'),
    cannotDemoteSelf: () =>
      AppError.forbidden('You cannot demote yourself from the admin role'),
    notInDatabase: (userId: string) =>
      AppError.internalError(`User with ID ${userId} not found in database`),
  }

  static comment = {
    notFound: () => AppError.notFound('Comment'),
    parentNotFound: () => AppError.notFound('Parent comment'),
    alreadyDeleted: () => AppError.badRequest('Comment is already deleted'),
    cannotEditDeleted: () =>
      AppError.badRequest('Cannot edit a deleted comment'),
  }
}
