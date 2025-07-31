import { getFromCache } from '@/lib/cache/seo-cache'
import { withMetrics } from '@/lib/monitoring/seo-metrics'
import { prisma } from '@/server/db'
import { ms } from '@/utils/time'
import { ApprovalStatus } from '@orm'

/**
 * Database queries optimized for SEO metadata generation.
 * These queries are designed to be fast and fetch only the data needed for metadata.
 * All queries use caching to minimize database load.
 */

// Cache TTLs based on content type
const CACHE_TTL = {
  GAME: ms.hours(1),
  LISTING: ms.minutes(30),
  USER: ms.hours(1),
  SITEMAP: ms.hours(6),
}

const CACHE_STALE = {
  GAME: ms.days(1),
  LISTING: ms.hours(12),
  USER: ms.days(1),
  SITEMAP: ms.days(2),
}

export async function getGameForSEO(id: string) {
  return withMetrics(
    'getGameForSEO',
    () =>
      getFromCache(
        `seo:game:${id}`,
        async () => {
          try {
            const game = await prisma.game.findUnique({
              where: { id },
              select: {
                id: true,
                title: true,
                imageUrl: true,
                system: { select: { name: true } },
              },
            })

            return game
          } catch {
            return null
          }
        },
        {
          ttl: CACHE_TTL.GAME,
          staleWhileRevalidate: CACHE_STALE.GAME,
        },
      ),
    { cacheKey: `seo:game:${id}` },
  )
}

export async function getListingForSEO(id: string) {
  return withMetrics(
    'getListingForSEO',
    () =>
      getFromCache(
        `seo:listing:${id}`,
        async () => {
          try {
            const listing = await prisma.listing.findUnique({
              where: { id },
              select: {
                id: true,
                notes: true,
                createdAt: true,
                game: { select: { title: true, imageUrl: true } },
                device: {
                  select: {
                    modelName: true,
                    brand: { select: { name: true } },
                  },
                },
                emulator: { select: { name: true } },
                performance: { select: { label: true, rank: true } },
                author: { select: { name: true } },
              },
            })

            return listing
          } catch {
            return null
          }
        },
        {
          ttl: CACHE_TTL.LISTING,
          staleWhileRevalidate: CACHE_STALE.LISTING,
        },
      ),
    { cacheKey: `seo:listing:${id}` },
  )
}

export async function getPcListingForSEO(id: string) {
  return withMetrics(
    'getPcListingForSEO',
    () =>
      getFromCache(
        `seo:pclisting:${id}`,
        async () => {
          try {
            const pcListing = await prisma.pcListing.findUnique({
              where: { id },
              select: {
                id: true,
                notes: true,
                createdAt: true,
                game: { select: { title: true, imageUrl: true } },
                cpu: {
                  select: {
                    modelName: true,
                    brand: { select: { name: true } },
                  },
                },
                gpu: {
                  select: {
                    modelName: true,
                    brand: { select: { name: true } },
                  },
                },
                performance: { select: { label: true, rank: true } },
                author: { select: { name: true } },
              },
            })

            return pcListing
          } catch {
            return null
          }
        },
        {
          ttl: CACHE_TTL.LISTING,
          staleWhileRevalidate: CACHE_STALE.LISTING,
        },
      ),
    { cacheKey: `seo:pclisting:${id}` },
  )
}

export async function getUserForSEO(id: string) {
  return withMetrics(
    'getUserForSEO',
    () =>
      getFromCache(
        `seo:user:${id}`,
        async () => {
          try {
            const user = await prisma.user.findUnique({
              where: { id },
              select: { id: true, name: true, profileImage: true },
            })

            return user
          } catch {
            return null
          }
        },
        {
          ttl: CACHE_TTL.USER,
          staleWhileRevalidate: CACHE_STALE.USER,
        },
      ),
    { cacheKey: `seo:user:${id}` },
  )
}

// For sitemap generation - cached longer since it's expensive
export async function getApprovedGamesForSitemap(limit = 1000) {
  return withMetrics(
    'getApprovedGamesForSitemap',
    () =>
      getFromCache(
        `seo:sitemap:games:${limit}`,
        async () => {
          try {
            const games = await prisma.game.findMany({
              where: { status: ApprovalStatus.APPROVED },
              select: { id: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: limit,
            })

            return games
          } catch {
            return []
          }
        },
        {
          ttl: CACHE_TTL.SITEMAP,
          staleWhileRevalidate: CACHE_STALE.SITEMAP,
        },
      ),
    { cacheKey: `seo:sitemap:games:${limit}` },
  )
}

export async function getApprovedListingsForSitemap(limit = 500) {
  return withMetrics(
    'getApprovedListingsForSitemap',
    () =>
      getFromCache(
        `seo:sitemap:listings:${limit}`,
        async () => {
          try {
            const listings = await prisma.listing.findMany({
              where: { status: ApprovalStatus.APPROVED },
              select: { id: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: limit,
            })

            return listings
          } catch {
            return []
          }
        },
        {
          ttl: CACHE_TTL.SITEMAP,
          staleWhileRevalidate: CACHE_STALE.SITEMAP,
        },
      ),
    { cacheKey: `seo:sitemap:listings:${limit}` },
  )
}

export async function getApprovedPcListingsForSitemap(limit = 500) {
  return withMetrics(
    'getApprovedPcListingsForSitemap',
    () =>
      getFromCache(
        `seo:sitemap:pclistings:${limit}`,
        async () => {
          try {
            const pcListings = await prisma.pcListing.findMany({
              where: { status: ApprovalStatus.APPROVED },
              select: { id: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: limit,
            })

            return pcListings
          } catch {
            return []
          }
        },
        {
          ttl: CACHE_TTL.SITEMAP,
          staleWhileRevalidate: CACHE_STALE.SITEMAP,
        },
      ),
    { cacheKey: `seo:sitemap:pclistings:${limit}` },
  )
}
