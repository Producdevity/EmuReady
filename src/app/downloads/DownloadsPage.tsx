'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button, PageSkeletonLoading } from '@/components/ui'
import DownloadsSection from './components/DownloadsSection'

function DownloadsPageContent() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <PageSkeletonLoading />

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to access downloads
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to download the EmuReady app.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" rounded asChild icon={ArrowLeft}>
            <Link href="/profile">Back to Profile</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Downloads</h1>
        <DownloadsSection />
      </div>
    </div>
  )
}

export default function DownloadsPage() {
  return (
    <Suspense fallback={<PageSkeletonLoading />}>
      <DownloadsPageContent />
    </Suspense>
  )
}
