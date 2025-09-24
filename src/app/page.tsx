import { type Metadata } from 'next'
import { PageWithMetadata } from '@/components/seo/PageWithMetadata'
import { generatePageMetadata, generateStructuredData } from '@/lib/seo/metadata'
import HomePage from './home/HomePage'

export const metadata: Metadata = generatePageMetadata(
  'Home',
  'Discover game compatibility reports for thousands of games across various emulators and devices. Find the perfect settings for your favorite games.',
  '/',
)

export default function Page() {
  const websiteData = generateStructuredData('WebSite', {
    name: 'EmuReady',
    description: 'The ultimate emulator compatibility database',
  })

  const organizationData = generateStructuredData('Organization', {
    description:
      'EmuReady provides comprehensive emulator compatibility information for games across various devices and platforms.',
  })

  return (
    <PageWithMetadata structuredData={[websiteData, organizationData]}>
      <HomePage />
    </PageWithMetadata>
  )
}
