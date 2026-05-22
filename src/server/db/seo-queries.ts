import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/server/db'
import { ApprovalStatus } from '@orm/client'

const SEO_CACHE_PROFILE = {
  RECORD: 'seo-record',
  REPORT: 'seo-report',
  SITEMAP: 'seo-sitemap',
  MISS: 'seo-miss',
} as const

export async function getGameForSEO(id: string) {
  'use cache'

  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      system: { select: { name: true } },
    },
  })

  cacheTag('games', `game-${id}`)
  cacheLife(game ? SEO_CACHE_PROFILE.RECORD : SEO_CACHE_PROFILE.MISS)
  return game
}

export async function getListingForSEO(id: string) {
  'use cache'

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      gameId: true,
      deviceId: true,
      emulatorId: true,
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

  cacheTag('listings', `listing-${id}`)
  if (listing) {
    cacheTag(
      `game-${listing.gameId}`,
      `device-${listing.deviceId}`,
      `emulator-${listing.emulatorId}`,
    )
  }

  cacheLife(listing ? SEO_CACHE_PROFILE.REPORT : SEO_CACHE_PROFILE.MISS)
  return listing
}

export async function getPcListingForSEO(id: string) {
  'use cache'

  const listing = await prisma.pcListing.findUnique({
    where: { id },
    select: {
      id: true,
      gameId: true,
      cpuId: true,
      gpuId: true,
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

  cacheTag('pc-listings', `pc-listing-${id}`)
  if (listing) {
    const tags = [`game-${listing.gameId}`, `cpu-${listing.cpuId}`]
    if (listing.gpuId) tags.push(`gpu-${listing.gpuId}`)
    cacheTag(...tags)
  }

  cacheLife(listing ? SEO_CACHE_PROFILE.REPORT : SEO_CACHE_PROFILE.MISS)
  return listing
}

export async function getUserForSEO(id: string) {
  'use cache'

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, profileImage: true },
  })

  cacheTag(`user-${id}`)
  cacheLife(user ? SEO_CACHE_PROFILE.RECORD : SEO_CACHE_PROFILE.MISS)
  return user
}

export async function getApprovedGamesForSitemap(limit = 1000) {
  'use cache'

  const games = await prisma.game.findMany({
    where: { status: ApprovalStatus.APPROVED },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  cacheLife(SEO_CACHE_PROFILE.SITEMAP)
  cacheTag('sitemap', 'games')
  return games
}

export async function getApprovedListingsForSitemap(limit = 500) {
  'use cache'

  const listings = await prisma.listing.findMany({
    where: { status: ApprovalStatus.APPROVED },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  cacheLife(SEO_CACHE_PROFILE.SITEMAP)
  cacheTag('sitemap', 'listings')
  return listings
}

export async function getApprovedPcListingsForSitemap(limit = 500) {
  'use cache'

  const listings = await prisma.pcListing.findMany({
    where: { status: ApprovalStatus.APPROVED },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  cacheLife(SEO_CACHE_PROFILE.SITEMAP)
  cacheTag('sitemap', 'pc-listings')
  return listings
}
