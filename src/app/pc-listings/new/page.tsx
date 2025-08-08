import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import NewPcListingPage from './NewPcListingPage'

export const metadata: Metadata = generatePageMetadata(
  'Create PC Compatibility Report',
  'Share your PC gaming experience. Report game performance on your Windows, Mac, or Linux system.',
  '/pc-listings/new',
)

export default function Page() {
  return <NewPcListingPage />
}
