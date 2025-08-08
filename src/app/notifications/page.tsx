import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo/metadata'
import NotificationsPage from './NotificationsPage'

export const metadata: Metadata = generatePageMetadata(
  'Notifications',
  'View your notifications and updates from the EmuReady community.',
  '/notifications',
)

export default function Page() {
  return <NotificationsPage />
}
