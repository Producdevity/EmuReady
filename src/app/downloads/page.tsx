import DownloadsPage from './DownloadsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Downloads - EmuReady',
  description: 'Download the EmuReady mobile app for Android.',
}

export default function Page() {
  return <DownloadsPage />
}
