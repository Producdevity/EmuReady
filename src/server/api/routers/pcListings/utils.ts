import { AppError } from '@/lib/errors'
import { listingStatsCache } from '@/server/utils/cache'
import { Prisma } from '@orm/client'

export const PC_LISTING_STATS_CACHE_KEY = 'pc-listing-stats'

export function invalidatePcListingStatsCache(): void {
  listingStatsCache.delete(PC_LISTING_STATS_CACHE_KEY)
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function toPrismaNestedJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(toPrismaNestedJsonValue)
  if (isJsonRecord(value)) {
    const result: Record<string, Prisma.InputJsonValue | null> = {}
    for (const [key, entryValue] of Object.entries(value)) {
      result[key] = toPrismaNestedJsonValue(entryValue)
    }

    return result
  }

  return AppError.invalidInput('customFieldValues')
}

export function toPrismaCustomFieldValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined) return Prisma.JsonNull

  const normalizedValue = toPrismaNestedJsonValue(value)
  if (normalizedValue === null) return Prisma.JsonNull

  return normalizedValue
}
