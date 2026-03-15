import type { PaginationResult } from '@/server/utils/pagination'
import type { Role } from '@orm'

export interface VisibilityContext {
  requestingUserId?: string
  requestingUserRole?: Role
}

export type VisibilityGatedList<T> =
  | { visibility: 'visible'; items: T[]; pagination: PaginationResult }
  | { visibility: 'hidden' }

export type VisibilityGatedCounts<T extends Record<string, number>> =
  | { visibility: 'visible'; counts: T }
  | { visibility: 'hidden' }

export function hiddenList(): { visibility: 'hidden' } {
  return { visibility: 'hidden' }
}

export function visibleList<T>(
  items: T[],
  pagination: PaginationResult,
): { visibility: 'visible'; items: T[]; pagination: PaginationResult } {
  return { visibility: 'visible', items, pagination }
}

export function hiddenCounts(): { visibility: 'hidden' } {
  return { visibility: 'hidden' }
}

export function visibleCounts<T extends Record<string, number>>(
  counts: T,
): { visibility: 'visible'; counts: T } {
  return { visibility: 'visible', counts }
}
