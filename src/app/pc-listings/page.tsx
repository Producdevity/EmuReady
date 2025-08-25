import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import PcListingsPage from './PcListingsPage'

export const metadata: Metadata = generatePageMetadata(
  'PC Compatibility Reports',
  'Browse PC emulator compatibility reports. Find optimal settings for running games on Windows, Mac, and Linux systems.',
  '/pc-listings',
)

// Revalidate every 10 seconds for near real-time updates
export const revalidate = 10

export default function Page() {
  return <PcListingsPage />
}
