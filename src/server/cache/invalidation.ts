import { revalidatePath, revalidateTag } from 'next/cache'
import { invalidateCache } from '@/lib/cache/seo-cache'

/**
 * Cache invalidation strategies for SEO content
 * Coordinates between in-memory cache and Next.js ISR cache
 */

export async function invalidateGame(gameId: string) {
  const startTime = performance.now()

  invalidateCache(`seo:game:${gameId}`)

  try {
    revalidatePath(`/games/${gameId}`)
  } catch (error) {
    console.error(`Failed to revalidate game path: ${gameId}`, error)
  }

  const duration = performance.now() - startTime
  if (duration > 100) {
    console.warn(
      `[SEO] Slow cache invalidation for game ${gameId}: ${duration.toFixed(2)}ms`,
    )
  }
}

export async function invalidateListing(listingId: string) {
  invalidateCache(`seo:listing:${listingId}`)

  try {
    revalidatePath(`/listings/${listingId}`)
  } catch (error) {
    console.error(`Failed to revalidate listing path: ${listingId}`, error)
  }
}

export async function invalidatePcListing(pcListingId: string) {
  invalidateCache(`seo:pclisting:${pcListingId}`)

  try {
    revalidatePath(`/pc-listings/${pcListingId}`)
  } catch (error) {
    console.error(`Failed to revalidate PC listing path: ${pcListingId}`, error)
  }
}

export async function invalidateUser(userId: string) {
  invalidateCache(`seo:user:${userId}`)

  try {
    revalidatePath(`/users/${userId}`)
  } catch (error) {
    console.error(`Failed to revalidate user path: ${userId}`, error)
  }
}

export async function invalidateSitemap() {
  invalidateCache(/^seo:sitemap:/)

  try {
    revalidatePath('/sitemap.xml')
  } catch (error) {
    console.error('Failed to revalidate sitemap', error)
  }
}

export async function invalidateListPages() {
  try {
    revalidatePath('/games')
    revalidatePath('/listings')
    revalidatePath('/pc-listings')
  } catch (error) {
    console.error('Failed to revalidate list pages', error)
  }
}

export async function invalidateGameRelatedContent(gameId: string) {
  const startTime = performance.now()

  await invalidateGame(gameId)

  const listingsInvalidated = invalidateCache(
    new RegExp(`seo:(listing|pclisting):.*game:${gameId}`),
  )

  await invalidateListPages()

  const duration = performance.now() - startTime
  console.log(
    `[SEO] Batch invalidation for game ${gameId}: ${listingsInvalidated} listings cleared in ${duration.toFixed(2)}ms`,
  )
}

export async function revalidateByTag(tag: string) {
  try {
    revalidateTag(tag)
  } catch (error) {
    console.error(`Failed to revalidate tag: ${tag}`, error)
  }
}
