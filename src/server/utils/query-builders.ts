import { hasPermission } from '@/utils/permissions'
import { type Prisma, ApprovalStatus, Role } from '@orm'

/**
 * Build where clause for shadow ban filtering
 * Excludes content from banned users for non-moderators
 */
export function buildShadowBanFilter(
  userRole?: Role | null,
  _userId?: string | null,
): Prisma.UserWhereInput | undefined {
  // Moderators and above can see all content
  if (userRole && hasPermission(userRole, Role.MODERATOR)) {
    return undefined
  }

  // Regular users don't see content from banned users
  return {
    userBans: {
      none: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
  }
}

/**
 * Build where clause for approval status filtering
 * Handles visibility rules for different user roles
 */
type ApprovalStatusFilterObject =
  | { status: ApprovalStatus; [key: string]: unknown }
  | { status: ApprovalStatus }

type ApprovalStatusFilter = ApprovalStatusFilterObject | undefined

export function buildApprovalStatusFilter<
  _T extends { status: ApprovalStatus },
>(
  userRole?: Role | null,
  userId?: string | null,
  requestedStatus?: ApprovalStatus,
  authorField = 'authorId',
): ApprovalStatusFilterObject[] | ApprovalStatusFilter {
  // Mods can see everything
  if (userRole && hasPermission(userRole, Role.MODERATOR)) {
    return requestedStatus ? { status: requestedStatus } : undefined
  }

  // If specific status requested
  if (requestedStatus) {
    if (requestedStatus === ApprovalStatus.PENDING && userId) {
      // Users can only see their own pending items
      return {
        status: ApprovalStatus.PENDING,
        [authorField]: userId,
      }
    }
    return { status: requestedStatus }
  }

  // Default visibility rules
  if (userId) {
    // Authenticated users see approved items + their own pending items
    return [
      { status: ApprovalStatus.APPROVED },
      { status: ApprovalStatus.PENDING, [authorField]: userId },
    ]
  }

  // Public users only see approved items
  return { status: ApprovalStatus.APPROVED }
}

type SearchCondition = Record<string, unknown>

/**
 * Build search conditions across multiple fields
 * Supports both simple and multi-word searches
 */
export function buildSearchFilter(
  searchTerm: string | null | undefined,
  fields: string[],
): SearchCondition[] | undefined {
  if (!searchTerm?.trim()) return undefined

  const trimmedSearch = searchTerm.trim()
  const searchConditions: SearchCondition[] = []

  // For multi-word searches, ensure all words are present
  if (trimmedSearch.includes(' ')) {
    const words = trimmedSearch.split(/\s+/).filter((word) => word.length >= 2)

    // Each field should contain all words
    fields.forEach((field) => {
      const condition = {
        AND: words.map((word) => createNestedContains(field, word)),
      }
      searchConditions.push(condition)
    })
  } else {
    // Simple single-word search
    fields.forEach((field) => {
      searchConditions.push(createNestedContains(field, trimmedSearch))
    })
  }

  return searchConditions.length > 0 ? searchConditions : undefined
}

/**
 * Create nested contains condition for dot-notation fields
 * e.g., 'user.name' becomes { user: { name: { contains: value } } }
 */
function createNestedContains(field: string, value: string): SearchCondition {
  const parts = field.split('.')
  let condition: Record<string, unknown> = {
    contains: value,
    mode: 'insensitive',
  }

  // Build nested structure from right to left
  for (let i = parts.length - 1; i >= 0; i--) {
    condition = { [parts[i]]: condition }
  }

  return condition
}

/**
 * Build filter for NSFW content based on user preferences
 */
export function buildNsfwFilter(
  showNsfw?: boolean | null,
  fieldName = 'isErotic',
): Record<string, boolean> | undefined {
  return showNsfw === false ? { [fieldName]: false } : undefined
}

/**
 * Combine multiple where conditions with proper AND/OR logic
 */
export function combineWhereConditions(
  conditions: (Record<string, unknown> | undefined)[],
  logic: 'AND' | 'OR' = 'AND',
): Record<string, unknown> {
  const validConditions = conditions.filter(
    (condition): condition is Record<string, unknown> =>
      condition !== undefined && condition !== null,
  )

  if (validConditions.length === 0) return {}
  if (validConditions.length === 1) return validConditions[0]

  return { [logic]: validConditions }
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  fieldName = 'createdAt',
): Record<string, unknown> | undefined {
  if (!startDate && !endDate) return undefined

  const filter: Record<string, Date> = {}

  if (startDate) filter.gte = new Date(startDate)

  if (endDate) filter.lte = new Date(endDate)

  return { [fieldName]: filter }
}

/**
 * Build filter for array fields (e.g., IDs)
 */
export function buildArrayFilter<T>(
  values: T[] | undefined | null,
  fieldName: string,
): Record<string, { in: T[] }> | undefined {
  return !values || values.length === 0
    ? undefined
    : { [fieldName]: { in: values } }
}

/**
 * Build nested filters for related entities
 */
export function buildRelationFilter(
  relationName: string,
  conditions: Record<string, unknown>,
  type: 'some' | 'none' | 'every' = 'some',
): Record<string, unknown> {
  return { [relationName]: { [type]: conditions } }
}

/**
 * Build filter for checking existence of relations
 */
export function buildExistenceFilter(
  relationName: string,
  exists: boolean,
): Record<string, unknown> {
  return { [relationName]: exists ? { some: {} } : { none: {} } }
}
