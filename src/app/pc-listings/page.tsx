'use client'

import { Suspense, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PcListingsContent } from './components/PcListingsContent'
import { PcListingsFilters } from './components/PcListingsFilters'
import { PcListingsHeader } from './components/PcListingsHeader'

function PcListingsPageContent() {
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex">
        {/* Filters Sidebar */}
        <div className="flex-shrink-0">
          <Suspense fallback={<LoadingSpinner />}>
            <PcListingsFilters
              isCollapsed={isFiltersCollapsed}
              onToggleCollapse={() =>
                setIsFiltersCollapsed(!isFiltersCollapsed)
              }
            />
          </Suspense>
        </div>

        {/* Main Content */}
        <section className="flex-1 overflow-x-auto py-4 px-2 md:px-4 lg:py-6 lg:pl-8">
          <div className="container mx-auto">
            <PcListingsHeader />

            <div className="mt-6">
              <Suspense fallback={<LoadingSpinner />}>
                <PcListingsContent />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function PcListingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <PcListingsPageContent />
    </Suspense>
  )
}
