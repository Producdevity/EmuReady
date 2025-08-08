import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import EmulatorsPage from './EmulatorsPage'

export const metadata: Metadata = generatePageMetadata(
  'Emulators',
  'Discover all supported emulators and their compatibility with various games. Compare features and performance across different emulation platforms.',
  '/emulators',
)

export default function Page() {
  return <EmulatorsPage />
}
