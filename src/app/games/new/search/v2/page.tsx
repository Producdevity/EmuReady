import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import IGDBSearchPage from './IGDBSearchPage'

export const metadata: Metadata = generatePageMetadata(
  'Search Games (IGDB)',
  'Search IGDB for comprehensive game information. Find and add games to create compatibility reports.',
  '/games/new/search/v2',
)

export default function Page() {
  return <IGDBSearchPage />
}
