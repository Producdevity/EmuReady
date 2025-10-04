import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import GamesPage from './GamesPage'

export const metadata: Metadata = generatePageMetadata(
  'Games',
  'Browse our extensive database of games with emulator compatibility reports. Search by game title, system, or genre.',
  '/games',
)

export default function Page() {
  return <GamesPage />
}
