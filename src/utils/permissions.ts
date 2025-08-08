import { Role } from '@orm'

/**
 * Check if the user has permission to perform an action based on their role.
 * Provide no role to allow all users.
 * returns true if the user has permission, false otherwise.
 *
 * @param userRole - The role of the user attempting to perform the action
 * @param requiredRole - The minimum role required to perform the action
 */
export function hasPermission(userRole?: Role | null, requiredRole?: Role): boolean {
  if (!userRole) return false
  if (!requiredRole) return true

  const roles: Role[] = [
    Role.USER,
    Role.AUTHOR,
    Role.DEVELOPER,
    Role.MODERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]
  const userRoleIndex = roles.indexOf(userRole)
  const requiredRoleIndex = roles.indexOf(requiredRole)

  return userRoleIndex >= requiredRoleIndex
}

/**
 * Check if a user has permission to edit a comment
 * @param userRole - The role of the user attempting to edit
 * @param commentUserId - The ID of the user who created the comment
 * @param currentUserId - The ID of the user attempting to edit
 * @returns boolean
 */
export function canEditComment(
  userRole?: Role,
  commentUserId?: string,
  currentUserId?: string,
): boolean {
  if (!currentUserId || !commentUserId) return false
  // Moderators and above can edit any comment
  if (hasPermission(userRole, Role.MODERATOR)) return true
  // Users can edit their own comments
  return commentUserId === currentUserId
}

/**
 * Check if a user has permission to delete a comment
 * @param userRole - The role of the user attempting to delete
 * @param commentUserId - The ID of the user who created the comment
 * @param currentUserId - The ID of the user attempting to delete
 * @returns boolean
 */
export function canDeleteComment(
  userRole?: Role,
  commentUserId?: string,
  currentUserId?: string,
): boolean {
  if (!currentUserId || !commentUserId) return false
  // Moderators and above can delete any comment (for offensive/inappropriate content)
  if (hasPermission(userRole, Role.MODERATOR)) return true
  // Users can delete their own comments
  return commentUserId === currentUserId
}

/**
 * Check if user is a moderator or higher
 * @param userRole - The role to check
 * @returns boolean
 */
export function isModerator(userRole?: Role | null): boolean {
  if (!userRole) return false
  return hasPermission(userRole, Role.MODERATOR)
}
