import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import V2ListingsPage from './V2ListingsPage'

export const metadata: Metadata = generatePageMetadata(
  'Compatibility Reports V2',
  'Enhanced compatibility reports interface with advanced filtering and search capabilities.',
  '/v2/listings',
)

export default function Page() {
  return <V2ListingsPage />
}
