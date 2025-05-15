import { type Role } from '@orm'

/**
 * Check if the user has permission to perform an action based on their role.
 * Provide no role to allow all users.
 * returns true if the user has permission, false otherwise.
 *
 * @param userRole
 * @param requiredRole
 */
function hasPermission(userRole?: Role, requiredRole?: Role): boolean {
  if (!userRole) return false
  if (!requiredRole) return true

  const roles: Role[] = ['USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN']
  const userRoleIndex = roles.indexOf(userRole)
  const requiredRoleIndex = roles.indexOf(requiredRole)

  return userRoleIndex >= requiredRoleIndex
}

export default hasPermission
