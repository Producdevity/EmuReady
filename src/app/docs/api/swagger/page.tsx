import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import SwaggerPage from './SwaggerPage'

export const metadata: Metadata = generatePageMetadata(
  'API Interactive Documentation',
  'Interactive Swagger UI documentation for the EmuReady Mobile API. Test endpoints and explore the API.',
  '/docs/api/swagger',
)

export default function Page() {
  return <SwaggerPage />
}
