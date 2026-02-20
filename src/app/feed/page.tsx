import FeedPage from './FeedPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activity Feed - EmuReady',
  description: 'See recent activity from users you follow on EmuReady.',
}

export default function Page() {
  return <FeedPage />
}
