import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import ProfilePage from './ProfilePage'

export const metadata: Metadata = generatePageMetadata(
  'My Profile',
  'Manage your EmuReady profile, view your contributions, and customize your preferences.',
  '/profile',
)

export default function Page() {
  return <ProfilePage />
}
