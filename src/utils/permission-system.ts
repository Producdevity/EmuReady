import { type Maybe } from '@/types/utils'
import { Role } from '@orm'
import type { TRPCContext } from '@/server/api/trpc'

/**
 * Check if a user has a specific permission
 * @param userPermissions Array of permission keys the user has
 * @param requiredPermission The permission key to check for
 * @returns boolean indicating if user has the permission
 */
export function hasPermission(
  userPermissions: string[] | undefined | null,
  requiredPermission: string,
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false

  return userPermissions.includes(requiredPermission)
}

/**
 * Check if a user has any of the specified permissions
 * @param userPermissions Array of permission keys the user has
 * @param requiredPermissions Array of permission keys to check for
 * @returns boolean indicating if user has at least one of the permissions
 */
export function hasAnyPermission(
  userPermissions: string[] | undefined | null,
  requiredPermissions: string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false

  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  )
}

/**
 * Check if a user has all of the specified permissions
 * @param userPermissions Array of permission keys the user has
 * @param requiredPermissions Array of permission keys to check for
 * @returns boolean indicating if user has all of the permissions
 */
export function hasAllPermissions(
  userPermissions: string[] | undefined | null,
  requiredPermissions: string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }

  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  )
}

/**
 * Context-aware permission check for tRPC procedures
 * @param ctx tRPC context containing user session
 * @param requiredPermission The permission key to check for
 * @returns boolean indicating if user has the permission
 */
export function hasPermissionInContext(
  ctx: TRPCContext,
  requiredPermission: string,
): boolean {
  return hasPermission(ctx.session?.user?.permissions, requiredPermission)
}

/**
 * Context-aware check for any permission
 * @param ctx tRPC context containing user session
 * @param requiredPermissions Array of permission keys to check for
 * @returns boolean indicating if user has at least one of the permissions
 */
export function hasAnyPermissionInContext(
  ctx: TRPCContext,
  requiredPermissions: string[],
): boolean {
  return hasAnyPermission(ctx.session?.user?.permissions, requiredPermissions)
}

/**
 * Context-aware check for all permissions
 * @param ctx tRPC context containing user session
 * @param requiredPermissions Array of permission keys to check for
 * @returns boolean indicating if user has all of the permissions
 */
export function hasAllPermissionsInContext(
  ctx: TRPCContext,
  requiredPermissions: string[],
): boolean {
  return hasAllPermissions(ctx.session?.user?.permissions, requiredPermissions)
}

// Permission constants for better type safety and IDE support
export const PERMISSIONS = {
  // Content Management
  CREATE_LISTING: 'create_listing',
  APPROVE_LISTINGS: 'approve_listings',
  EDIT_ANY_LISTING: 'edit_any_listing',
  DELETE_ANY_LISTING: 'delete_any_listing',

  // Comment Management
  EDIT_OWN_COMMENT: 'edit_own_comment',
  DELETE_OWN_COMMENT: 'delete_own_comment',
  EDIT_ANY_COMMENT: 'edit_any_comment',
  DELETE_ANY_COMMENT: 'delete_any_comment',

  // Game Management
  EDIT_GAMES: 'edit_games',
  DELETE_GAMES: 'delete_games',
  MANAGE_GAMES: 'manage_games',
  APPROVE_GAMES: 'approve_games',

  // Emulator Management
  MANAGE_EMULATORS: 'manage_emulators',
  MANAGE_CUSTOM_FIELDS: 'manage_custom_fields',
  MANAGE_EMULATOR_VERIFIED_DEVELOPERS: 'manage_emulator_verified_developers',

  // User Management
  MANAGE_USERS: 'manage_users',
  CHANGE_USER_ROLES: 'change_user_roles',
  MODIFY_SUPER_ADMIN_USERS: 'modify_super_admin_users',

  // User Moderation
  VIEW_USER_BANS: 'view_user_bans',
  MANAGE_USER_BANS: 'manage_user_bans',

  // System Access
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  VIEW_STATISTICS: 'view_statistics',
  VIEW_LOGS: 'view_logs',

  // Permission Management
  MANAGE_PERMISSIONS: 'manage_permissions',
  VIEW_PERMISSION_LOGS: 'view_permission_logs',

  // Trust System
  MANAGE_TRUST_SYSTEM: 'manage_trust_system',
  VIEW_TRUST_LOGS: 'view_trust_logs',

  // Device Management
  MANAGE_DEVICES: 'manage_devices',

  // System Management
  MANAGE_SYSTEMS: 'manage_systems',
} as const

// Type for permission keys
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Utility to check if a role hierarchically includes another role (backward compatibility)
export function roleIncludesRole(
  userRole: Maybe<Role>,
  requiredRole: Role,
): boolean {
  if (!userRole) return false
  const roleHierarchy: Role[] = [
    Role.USER,
    Role.AUTHOR,
    Role.DEVELOPER,
    Role.MODERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]

  const userRoleIndex = roleHierarchy.indexOf(userRole)
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)

  return userRoleIndex >= requiredRoleIndex
}
