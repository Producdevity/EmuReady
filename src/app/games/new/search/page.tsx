import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import GameSearchPage from './GameSearchPage'

export const metadata: Metadata = generatePageMetadata(
  'Search Games Database',
  'Search TheGamesDB for game information. Find and add games to create compatibility reports.',
  '/games/new/search',
)

export default function Page() {
  return <GameSearchPage />
}
