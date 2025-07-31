import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import GamesPage from './GamesPage'

export const metadata: Metadata = generatePageMetadata(
  'Games',
  'Browse our extensive database of games with emulator compatibility reports. Search by game title, system, or genre.',
  '/games',
)

// Revalidate every 30 minutes to show new games
export const revalidate = 1800

export default function Page() {
  return <GamesPage />
}
