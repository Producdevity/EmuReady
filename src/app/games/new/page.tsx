import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import NewGamePage from './NewGamePage'

export const metadata: Metadata = generatePageMetadata(
  'Add New Game',
  'Add a new game to the EmuReady database. Help build the most comprehensive emulation compatibility resource.',
  '/games/new',
)

export default function Page() {
  return <NewGamePage />
}
