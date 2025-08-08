import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageWithMetadata } from '@/components/seo/PageWithMetadata'
import { generatePageMetadata, generateStructuredData } from '@/lib/seo/metadata'
import { getPcListingForSEO } from '@/server/db/seo-queries'
import PcListingDetailsPage from './PcListingDetailsPage'

interface Props {
  params: Promise<{ id: string }>
}

// Revalidate every 30 minutes
export const revalidate = 1800

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const listing = await getPcListingForSEO(params.id)

  if (!listing) {
    return generatePageMetadata('PC Compatibility Report Not Found')
  }

  const description = `${listing.game.title} running on ${listing.cpu.modelName}${listing.gpu ? ` with ${listing.gpu.modelName}` : ''}. Performance: ${listing.performance.label}`

  return generatePageMetadata(
    `${listing.game.title} PC Performance`,
    description,
    `/pc-listings/${listing.id}`,
    listing.game.imageUrl || undefined,
  )
}

export default async function Page(props: Props) {
  const params = await props.params
  const listing = await getPcListingForSEO(params.id)

  if (!listing) {
    notFound()
  }

  const structuredData = generateStructuredData('Review', {
    gameName: listing.game.title,
    emulatorName: 'PC',
    deviceName: `${listing.cpu.modelName}${listing.gpu ? ` / ${listing.gpu.modelName}` : ''}`,
    authorName: listing.author.name || 'Anonymous',
    datePublished: listing.createdAt.toISOString(),
    performanceRating: listing.performance.rank,
    compatibilityNotes: listing.notes || undefined,
  })

  return (
    <PageWithMetadata structuredData={structuredData}>
      <PcListingDetailsPage />
    </PageWithMetadata>
  )
}
