import { generatePageMetadata } from '@/lib/seo/metadata'
import DevicesPage from './DevicesPage'
import type { Metadata } from 'next'

export const metadata: Metadata = generatePageMetadata(
  'Devices',
  'Browse all supported devices including PC Handhelds, Android Handhelds, Smartphones and Tablets. Find compatibility reports for your specific device.',
  '/devices',
)

export default function Page() {
  return <DevicesPage />
}
