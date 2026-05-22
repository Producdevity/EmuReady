import { revalidatePath, revalidateTag } from 'next/cache'

interface PcListingSeoTarget {
  id: string
  gameId: string
  cpuId: string
  gpuId: string | null
}

export async function invalidateGame(gameId: string) {
  const startTime = performance.now()

  try {
    revalidatePath(`/games/${gameId}`)
    revalidateTag(`game-${gameId}`, 'max')
  } catch (error) {
    console.error(`Failed to revalidate game path: ${gameId}`, error)
  }

  const duration = performance.now() - startTime
  if (duration > 100) {
    console.warn(`[SEO] Slow cache invalidation for game ${gameId}: ${duration.toFixed(2)}ms`)
  }
}

export async function invalidateListing(listingId: string) {
  try {
    revalidatePath(`/listings/${listingId}`)
    revalidateTag(`listing-${listingId}`, 'max')
  } catch (error) {
    console.error(`Failed to revalidate listing path: ${listingId}`, error)
  }
}

export async function invalidatePcListing(pcListingId: string) {
  try {
    revalidatePath(`/pc-listings/${pcListingId}`)
    revalidateTag(`pc-listing-${pcListingId}`, 'max')
  } catch (error) {
    console.error(`Failed to revalidate PC listing path: ${pcListingId}`, error)
  }
}

export async function invalidateUser(userId: string) {
  try {
    revalidatePath(`/users/${userId}`)
    revalidateTag(`user-${userId}`, 'max')
  } catch (error) {
    console.error(`Failed to revalidate user path: ${userId}`, error)
  }
}

export async function invalidateSitemap() {
  try {
    revalidatePath('/sitemap.xml')
    revalidateTag('sitemap', 'max')
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
  await invalidateListPages()

  const duration = performance.now() - startTime
  console.log(`[SEO] Batch invalidation for game ${gameId} completed in ${duration.toFixed(2)}ms`)
}

export async function invalidatePcListingSeo(listing: PcListingSeoTarget) {
  await invalidatePcListingSeoTargets([listing.id], [listing])
}

export async function invalidatePcListingSeoForUpdate(
  previous: PcListingSeoTarget,
  next: PcListingSeoTarget,
) {
  await invalidatePcListingSeoTargets([previous.id], [previous, next])
}

export async function invalidatePcListingsSeo(listings: PcListingSeoTarget[]) {
  await invalidatePcListingSeoTargets(
    listings.map((listing) => listing.id),
    listings,
  )
}

export async function revalidateByTag(tag: string) {
  try {
    revalidateTag(tag, 'max')
  } catch (error) {
    console.error(`Failed to revalidate tag: ${tag}`, error)
  }
}

async function invalidatePcListingSeoTargets(
  listingIds: string[],
  tagTargets: PcListingSeoTarget[],
) {
  if (listingIds.length === 0 && tagTargets.length === 0) return

  const uniqueListingIds = [...new Set(listingIds)]
  const tags = collectPcListingSeoTags(tagTargets)

  await Promise.all(uniqueListingIds.map((listingId) => invalidatePcListing(listingId)))
  await invalidateListPages()
  await invalidateSitemap()
  await Promise.all([...tags].map((tag) => revalidateByTag(tag)))
}

function collectPcListingSeoTags(listings: PcListingSeoTarget[]): Set<string> {
  const tags = new Set<string>(['pc-listings'])

  for (const listing of listings) {
    tags.add(`game-${listing.gameId}`)
    tags.add(`cpu-${listing.cpuId}`)
    if (listing.gpuId) tags.add(`gpu-${listing.gpuId}`)
  }

  return tags
}
