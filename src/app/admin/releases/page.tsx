'use client'

import { AdminPageLayout } from '@/components/admin'
import CreateReleaseCard from './components/CreateReleaseCard'
import RecentReleasesCard from './components/RecentReleasesCard'

export default function AdminReleasesPage() {
  return (
    <AdminPageLayout title="Android Releases" description="Manage EmuReady Beta APK releases.">
      <div className="grid md:grid-cols-2 gap-6">
        <CreateReleaseCard />
        <RecentReleasesCard />
      </div>
    </AdminPageLayout>
  )
}
