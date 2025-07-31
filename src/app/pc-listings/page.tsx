import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import PcListingsPage from './PcListingsPage'

export const metadata: Metadata = generatePageMetadata(
  'PC Compatibility Reports',
  'Browse PC emulator compatibility reports. Find optimal settings for running games on Windows, Mac, and Linux systems.',
  '/pc-listings',
)

// Revalidate every 15 minutes to show new listings
export const revalidate = 900

export default function Page() {
  return <PcListingsPage />
}
