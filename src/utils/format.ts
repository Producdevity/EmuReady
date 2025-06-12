import { type Role } from '@orm'
import { pipe, map, split, capitalize, toLowerCase, join } from 'remeda'

/**
 * Formats a user role by replacing underscores with spaces,
 * converting to lowercase, capitalizing each word, and joining them.
 *
 * @example
 * formatUserRole('SUPER_ADMIN') // returns 'Super Admin'
 *
 * @param role - The user role to format.
 * @returns The formatted role string.
 */
export function formatUserRole(role: Role) {
  return pipe(
    role,
    (r: string) => r.replace('_', ' '),
    toLowerCase,
    split(' '),
    map((word) => capitalize(word)),
    join(' '),
  )
}
