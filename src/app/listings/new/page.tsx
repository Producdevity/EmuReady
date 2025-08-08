import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import NewListingPage from './NewListingPage'

export const metadata: Metadata = generatePageMetadata(
  'Create Compatibility Report',
  'Share your emulation experience. Report how games perform on your device with specific emulator settings.',
  '/listings/new',
)

export default function Page() {
  return <NewListingPage />
}
