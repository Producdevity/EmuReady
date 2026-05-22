import { type MetadataRoute } from 'next'
import {
  getApprovedGamesForSitemap,
  getApprovedListingsForSitemap,
  getApprovedPcListingsForSitemap,
} from '@/server/db/seo-queries'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://emuready.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${appUrl}/games`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${appUrl}/listings`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${appUrl}/pc-listings`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${appUrl}/emulators`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${appUrl}/devices`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${appUrl}/terms`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${appUrl}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    const games = await getApprovedGamesForSitemap(1000)

    const gamePages: MetadataRoute.Sitemap = games
      ? games.map((game) => ({
          url: `${appUrl}/games/${game.id}`,
          lastModified: game.createdAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
      : []

    const listings = await getApprovedListingsForSitemap(500)

    const listingPages: MetadataRoute.Sitemap = listings
      ? listings.map((listing) => ({
          url: `${appUrl}/listings/${listing.id}`,
          lastModified: listing.createdAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        }))
      : []

    const pcListings = await getApprovedPcListingsForSitemap(500)

    const pcListingPages: MetadataRoute.Sitemap = pcListings
      ? pcListings.map((listing) => ({
          url: `${appUrl}/pc-listings/${listing.id}`,
          lastModified: listing.createdAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        }))
      : []

    return [...staticPages, ...gamePages, ...listingPages, ...pcListingPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
