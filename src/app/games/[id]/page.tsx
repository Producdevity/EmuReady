import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageWithMetadata } from '@/components/seo/PageWithMetadata'
import {
  generatePageMetadata,
  generateStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/seo/metadata'
import { getGameForSEO } from '@/server/db/seo-queries'
import GameDetailsPage from './GameDetailsPage'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const game = await getGameForSEO(params.id)

  if (!game) return generatePageMetadata('Game Not Found')

  const description = `View compatibility reports for ${game.title} across various emulators and devices`

  return generatePageMetadata(
    game.title,
    description,
    `/games/${game.id}`,
    game.imageUrl || undefined,
  )
}

export default async function Page(props: Props) {
  const params = await props.params
  const game = await getGameForSEO(params.id)

  if (!game) notFound()

  const pageStructuredData = generateStructuredData('WebPage', {
    name: game.title,
    description: `Compatibility reports for ${game.title}`,
    url: `/games/${game.id}`,
  })

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Games', url: '/games' },
    { name: game.title, url: `/games/${game.id}` },
  ])

  return (
    <PageWithMetadata structuredData={[pageStructuredData, breadcrumbData]}>
      <GameDetailsPage />
    </PageWithMetadata>
  )
}
