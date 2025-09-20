/**
 * @documentation /docs/ERROR_HANDLING.md
 */
import { TRPCError } from '@trpc/server'
import { toArray } from '@/utils/array'
import { formatUserRole } from '@/utils/format'
import { type Role } from '@orm'

// Define error types as constants for better type safety
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
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
  INVALID_CAPTCHA: 'CAPTCHA verification failed',

  // Business logic errors
  OPERATION_NOT_ALLOWED: 'This operation is not allowed',
  RESOURCE_IN_USE: 'Cannot delete resource as it is currently in use',
  TOO_MANY_REQUESTS: 'Rate limit exceeded. Please try again later.',

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

  static insufficientRole(requiredRole?: Role): never {
    const formattedRole = requiredRole ? formatUserRole(requiredRole) : null
    const message = formattedRole
      ? `You need ${formattedRole} role to perform this action`
      : ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS

    throw new TRPCError({ code: ERROR_CODES.FORBIDDEN, message })
  }

  static insufficientRoles(roles: Role[] | string[]): never {
    const formattedRoles = roles.map((role) => formatUserRole(role as Role)).join(' or ')
    const message = `You need one of the following roles to perform this action: ${formattedRoles}`

    throw new TRPCError({ code: ERROR_CODES.FORBIDDEN, message })
  }

  static insufficientPermissions(permissions: string | string[]): never {
    const message = `You need the following permissions: ${toArray(permissions).join(', ')}`
    throw new TRPCError({ code: ERROR_CODES.FORBIDDEN, message })
  }

  // Resource errors
  static notFound(resource?: string): never {
    const message = resource ? `${resource} not found` : ERROR_MESSAGES.NOT_FOUND

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
    const message = field ? `Invalid input for field: ${field}` : ERROR_MESSAGES.INVALID_INPUT

    throw new TRPCError({ code: ERROR_CODES.BAD_REQUEST, message })
  }

  static missingRequiredField(field: string): never {
    throw new TRPCError({
      code: ERROR_CODES.BAD_REQUEST,
      message: `Required field missing: ${field}`,
    })
  }

  static captcha(message?: string) {
    throw new TRPCError({
      code: ERROR_CODES.BAD_REQUEST,
      message: message ? `CAPTCHA verification failed: ${message}` : ERROR_MESSAGES.INVALID_CAPTCHA,
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

  static tooManyRequests(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: message ?? ERROR_MESSAGES.TOO_MANY_REQUESTS,
    })
  }

  // System errors
  static internalError(message?: string): never {
    throw new TRPCError({
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: message ?? 'An internal server error occurred',
    })
  }

  static databaseError(operation?: string): never {
    const message = operation ? `Database error during ${operation}` : ERROR_MESSAGES.DATABASE_ERROR

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
    AppError.badRequest(`Options are required for ${fieldType} type custom fields`)
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
    alreadyExists: (name: string) => AppError.alreadyExists('Brand', `"${name}"`),
    inUse: (count: number) => AppError.resourceInUse('brand', count),
  }

  static apiKey = {
    notFound: (): never => AppError.notFound('API key'),
  }

  static permission = {
    notFound: () => AppError.notFound('Permission'),
    alreadyExists: (name: string) => AppError.alreadyExists('Permission', `key "${name}"`),
    systemCannotBeDeleted: () => AppError.forbidden('System permissions cannot be deleted'),
    inUse: (count: number) => AppError.resourceInUse('permission', count),
  }

  static device = {
    notFound: () => AppError.notFound('Device'),
    alreadyExists: (modelName: string) =>
      AppError.conflict(`A device with model name "${modelName}" already exists for this brand`),
    inUse: (count: number) => AppError.resourceInUse('device', count),
  }

  static soc = {
    notFound: () => AppError.notFound('SoC'),
    alreadyExists: (name: string) => AppError.alreadyExists('SoC', `name "${name}"`),
    inUse: (count: number) => AppError.resourceInUse('SoC', count),
  }

  static system = {
    notFound: () => AppError.notFound('System'),
    alreadyExists: (name: string) => AppError.alreadyExists('System', `name "${name}"`),
    hasGames: (count: number) => AppError.resourceInUse('system', count),
    inUse: (count: number) => AppError.resourceInUse('system', count),
  }

  static game = {
    notFound: () => AppError.notFound('Game'),
    inUse: (count: number) => AppError.resourceInUse('game', count),
    alreadyExists: (title: string, systemName: string) =>
      AppError.conflict(`A game titled "${title}" already exists for the system "${systemName}"`),
    alreadyProcessed: () => AppError.badRequest('Game has already been processed'),
    canOnlyEditOwn: () => AppError.forbidden('You can only edit your own games'),
    canOnlyEditPending: () => AppError.forbidden('You can only edit pending games'),
  }

  static emulator = {
    notFound: () => AppError.notFound('Emulator'),
    alreadyExists: (name: string) => AppError.alreadyExists('Emulator', `name "${name}"`),
    inUse: (count: number) => AppError.resourceInUse('emulator', count),
    canOnlyManageVerified: () =>
      AppError.forbidden('You can only manage emulators you are verified for'),
    requiresPermissionToDelete: () =>
      AppError.forbidden('You do not have permission to delete emulators'),
  }

  static listing = {
    notFound: () => AppError.notFound('Report'),
    alreadyExists: () =>
      AppError.conflict('A report for this game, device, and emulator combination already exists'),
    notPending: () => AppError.notFound('Pending report not found or already processed'),
    canOnlyEditOwn: () => AppError.forbidden('You can only edit your own report'),
    cannotEditRejected: () => AppError.badRequest('Rejected reports cannot be edited'),
    notAccessible: () => AppError.forbidden('This listing is not accessible.'),
    editTimeExpired: (timeLimitMinutes: number) =>
      AppError.badRequest(
        `You can only edit listings within ${timeLimitMinutes} minutes of approval`,
      ),
    requiresDeveloperToApprove: () =>
      AppError.forbidden('You need to be at least a Developer to approve listings'),
    requiresDeveloperToReject: () =>
      AppError.forbidden('You need to be at least a Developer to reject listings'),
    requiresModeratorToEdit: () =>
      AppError.forbidden('You need to be at least a Moderator to edit listings'),
    requiresModeratorToUpdate: () =>
      AppError.forbidden('You need to be at least a Moderator to update listings'),
    requiresAdminOrDeveloper: () => AppError.forbidden('Admin or Developer access required'),
    mustBeVerifiedToApprove: () =>
      AppError.forbidden('You can only approve listings for emulators you are verified for'),
    mustBeVerifiedToReject: () =>
      AppError.forbidden('You can only reject listings for emulators you are verified for'),
    mustBeVerifiedToViewConfigs: () =>
      AppError.forbidden('You can only view configs for emulators you are verified for'),
    cannotApproveBannedUser: (banReason: string) =>
      AppError.badRequest(`Cannot approve listing: Author is currently banned (${banReason})`),
  }

  static pcListing = {
    notFound: () => AppError.notFound('PC Report'),
    alreadyExists: () =>
      AppError.conflict(
        'A PC report for this game, CPU, GPU, and emulator combination already exists',
      ),
    notPending: () => AppError.notFound('Pending PC report not found or already processed'),
    canOnlyEditOwn: () => AppError.forbidden('You can only edit your own PC report'),
    canOnlyDeleteOwn: () => AppError.forbidden('You can only delete your own PC listings'),
    cannotEditRejected: () => AppError.badRequest('Rejected PC reports cannot be edited'),
    editTimeExpired: (timeLimitMinutes: number) =>
      AppError.badRequest(
        `You can only edit PC reports within ${timeLimitMinutes} minutes of approval`,
      ),
    approvalTimeNotFound: () => AppError.internalError('Approval time not found for PC report'),
    requiresDeveloperToView: () =>
      AppError.forbidden('You need to be at least a Developer to view pending PC listings'),
    requiresDeveloperToApprove: () =>
      AppError.forbidden('You need to be at least a Developer to approve PC listings'),
    requiresDeveloperToReject: () =>
      AppError.forbidden('You need to be at least a Developer to reject PC listings'),
    mustBeVerifiedToApprove: () =>
      AppError.forbidden('You can only approve PC listings for emulators you are verified for'),
    mustBeVerifiedToReject: () =>
      AppError.forbidden('You can only reject PC listings for emulators you are verified for'),
  }

  static notification = {
    notFound: () => AppError.notFound('Notification'),
    canOnlyMarkOwnAsRead: () =>
      AppError.forbidden('You can only mark your own notifications as read'),
  }

  static customField = {
    notFound: () => AppError.notFound('Custom field'),
    alreadyExists: (name: string) =>
      AppError.conflict(`A custom field with name "${name}" already exists for this emulator`),
    invalidForEmulator: (fieldId: string, emulatorId: string) =>
      AppError.badRequest(
        `Invalid custom field definition ID: ${fieldId} for emulator ${emulatorId}`,
      ),
    canOnlyManageVerified: () =>
      AppError.forbidden('You can only manage custom fields for emulators you are verified for'),
    rangeMinMaxRequired: () =>
      AppError.badRequest('Range minimum and maximum are required for RANGE type fields'),
    rangeMinLessThanMax: () => AppError.badRequest('Range minimum must be less than maximum'),
  }

  static customFieldTemplate = {
    notFound: () => AppError.notFound('Custom field template'),
    alreadyExists: (name: string) =>
      AppError.conflict(`A custom field template with name "${name}" already exists`),
    fieldNamesMustBeUnique: () =>
      AppError.badRequest('Field names must be unique within a template'),
  }

  static performanceScale = {
    notFound: () => AppError.notFound('Performance scale'),
    labelExists: (label: string) => AppError.alreadyExists('Performance scale', `label "${label}"`),
    rankExists: (rank: number) => AppError.alreadyExists('Performance scale', `rank ${rank}`),
    rankAlreadyExists: (rank: number) =>
      AppError.alreadyExists('Performance scale', `rank ${rank}`),
    alreadyExists: (label: string) =>
      AppError.alreadyExists('Performance scale', `label "${label}"`),
    inUse: (count: number) => AppError.resourceInUse('performance scale', count),
  }

  static user = {
    notFound: () => AppError.notFound('User'),
    emailExists: () => AppError.alreadyExists('User', 'this email'),
    usernameExists: () => AppError.alreadyExists('User', 'this username'),
    cannotDeleteSelf: () => AppError.forbidden('You cannot delete your own account'),
    cannotDemoteSelf: () => AppError.forbidden('You cannot demote yourself from the admin role'),
    profileNotAccessible: () => AppError.forbidden('This user profile is not accessible.'),
    needsPermissionToModifySuperAdmin: () =>
      AppError.forbidden('You need permission to modify super admin users'),
    needsPermissionToAssignSuperAdmin: () =>
      AppError.forbidden('You need permission to assign super admin role'),
    notInDatabase: (userId: string) =>
      AppError.internalError(`User with ID ${userId} not found in database`),
  }

  static comment = {
    noPermission: (action: string) =>
      AppError.forbidden(`You do not have permission to ${action} this comment`),
    notFound: () => AppError.notFound('Comment'),
    parentNotFound: () => AppError.notFound('Parent comment'),
    alreadyDeleted: () => AppError.badRequest('Comment is already deleted'),
    cannotEditDeleted: () => AppError.badRequest('Cannot edit a deleted comment'),
  }

  static userDevicePreference = {
    notFound: () => AppError.notFound('User device preference'),
    alreadyExists: () => AppError.alreadyExists('Device preference'),
    notInPreferences: () => AppError.notFound('Device not found in user preferences'),
  }

  static userSocPreference = {
    notFound: () => AppError.notFound('User SOC preference'),
    alreadyExists: () => AppError.alreadyExists('SOC preference'),
    notInPreferences: () => AppError.notFound('SOC not found in user preferences'),
  }

  static listingReport = {
    notFound: () => AppError.notFound('Listing report'),
    alreadyExists: () => AppError.conflict('You have already reported this listing'),
    cannotReportOwnListing: () => AppError.forbidden('You cannot report your own listing'),
  }

  static userBan = {
    notFound: () => AppError.notFound('User ban'),
    alreadyBanned: () => AppError.conflict('User already has an active ban'),
    cannotBanHigherRole: () =>
      AppError.forbidden('You cannot ban a user with equal or higher role than yours'),
    insufficientPermissions: () =>
      AppError.forbidden('You do not have sufficient permissions to ban this user'),
    alreadyInactive: () => AppError.badRequest('Ban is already inactive'),
    requiresModerator: () => AppError.forbidden('You need to be at least a Moderator to ban users'),
    requiresModeratorToUpdate: () =>
      AppError.forbidden('You need to be at least a Moderator to update bans'),
    requiresModeratorToLift: () =>
      AppError.forbidden('You need to be at least a Moderator to lift bans'),
    requiresModeratorToDelete: () =>
      AppError.forbidden('You need to be at least a Moderator to delete bans'),
  }

  static badge = {
    notFound: () => AppError.notFound('Badge'),
    alreadyExists: (name: string) =>
      AppError.conflict(`A badge with name "${name}" already exists`),
    inUse: (count: number) => AppError.resourceInUse('badge', count),
    inactive: () => AppError.badRequest('Cannot assign inactive badge'),
    alreadyAssigned: () => AppError.conflict('User already has this badge'),
    notAssigned: () => AppError.badRequest('User does not have this badge'),
  }

  static cpu = {
    notFound: () => AppError.notFound('CPU'),
    alreadyExists: (modelName: string) =>
      AppError.conflict(`A CPU with model name "${modelName}" already exists for this brand`),
    inUse: (count: number) => AppError.resourceInUse('CPU', count),
  }

  static gpu = {
    notFound: () => AppError.notFound('GPU'),
    alreadyExists: (modelName: string) =>
      AppError.conflict(`A GPU with model name "${modelName}" already exists for this brand`),
    inUse: (count: number) => AppError.resourceInUse('GPU', count),
  }

  static pcPreset = {
    notFound: () => AppError.notFound('PC preset'),
    alreadyExists: (name: string) =>
      AppError.conflict(`A PC preset with name "${name}" already exists for this user`),
    canOnlyViewOwn: () => AppError.forbidden('You can only view your own PC presets'),
    canOnlyEditOwn: () => AppError.forbidden('You can only edit your own PC presets'),
    canOnlyDeleteOwn: () => AppError.forbidden('You can only delete your own PC presets'),
  }

  static verification = {
    notFound: () => AppError.notFound('Verification'),
    canOnlyRemoveOwn: () => AppError.forbidden('You can only remove your own verifications'),
  }

  static verifiedDeveloper = {
    notFound: () => AppError.notFound('Verified Developer'),
    mustBeVerifiedToVerify: (emulatorName: string) =>
      AppError.badRequest(
        `You must be a verified developer for ${emulatorName} to verify reports for this emulator`,
      ),
    cannotVerifyOwnListings: () => AppError.forbidden('You cannot verify your own reports'),
    alreadyVerifiedListing: () => AppError.conflict('You have already verified this report'),
    userMustBeDeveloper: (userName: string, currentRole: string) =>
      AppError.forbidden(
        `${userName} must have the DEVELOPER role or higher to be verified as a developer. Current role: ${currentRole}`,
      ),
    userMustBeDeveloperToRemove: (userName: string, currentRole: string) =>
      AppError.forbidden(
        `${userName} must have the DEVELOPER role or higher to be removed as a verified developer. Current role: ${currentRole}`,
      ),
  }
}
