import { type MetadataRoute } from 'next'
import {
  getApprovedGamesForSitemap,
  getApprovedListingsForSitemap,
  getApprovedPcListingsForSitemap,
} from '@/server/db/seo-queries'

// Revalidate sitemap every 6 hours (6 * 60 * 60 = 21600 seconds)
export const revalidate = 21600

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://emuready.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${appUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${appUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${appUrl}/pc-listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${appUrl}/emulators`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${appUrl}/devices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${appUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    // Fetch games for dynamic sitemap entries
    const games = await getApprovedGamesForSitemap(1000)

    const gamePages: MetadataRoute.Sitemap = games
      ? games.map((game) => ({
          url: `${appUrl}/games/${game.id}`,
          lastModified: game.createdAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
      : []

    // Fetch recent listings
    const listings = await getApprovedListingsForSitemap(500)

    const listingPages: MetadataRoute.Sitemap = listings
      ? listings.map((listing) => ({
          url: `${appUrl}/listings/${listing.id}`,
          lastModified: listing.createdAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        }))
      : []

    // Fetch PC listings
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
    // Return only static pages if there's an error fetching dynamic content
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
