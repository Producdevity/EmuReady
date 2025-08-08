import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageWithMetadata } from '@/components/seo/PageWithMetadata'
import { generatePageMetadata, generateStructuredData } from '@/lib/seo/metadata'
import { getListingForSEO } from '@/server/db/seo-queries'
import ListingDetailsPage from './ListingDetailsPage'

interface Props {
  params: Promise<{ id: string }>
}

// Revalidate every 30 minutes
export const revalidate = 1800

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const listing = await getListingForSEO(params.id)

  if (!listing) {
    return generatePageMetadata('Compatibility Report Not Found')
  }

  const description = `${listing.game.title} running on ${listing.emulator.name} using ${listing.device.brand.name} ${listing.device.modelName}. Performance: ${listing.performance.label}`

  return generatePageMetadata(
    `${listing.game.title} on ${listing.emulator.name}`,
    description,
    `/listings/${listing.id}`,
    listing.game.imageUrl || undefined,
  )
}

export default async function Page(props: Props) {
  const params = await props.params
  const listing = await getListingForSEO(params.id)

  if (!listing) {
    notFound()
  }

  const structuredData = generateStructuredData('Review', {
    gameName: listing.game.title,
    emulatorName: listing.emulator.name,
    deviceName: `${listing.device.brand.name} ${listing.device.modelName}`,
    authorName: listing.author.name || 'Anonymous',
    datePublished: listing.createdAt.toISOString(),
    performanceRating: listing.performance.rank,
    compatibilityNotes: listing.notes || undefined,
  })

  return (
    <PageWithMetadata structuredData={structuredData}>
      <ListingDetailsPage />
    </PageWithMetadata>
  )
}
