import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import ListingsPage from './ListingsPage'

export const metadata: Metadata = generatePageMetadata(
  'Compatibility Reports',
  'Explore user-submitted compatibility reports for games running on various emulators and devices. Filter by performance, device type, and more.',
  '/listings',
)

export default function Page() {
  return <ListingsPage />
}
