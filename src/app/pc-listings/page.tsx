'use client'

import { X, FunnelIcon } from 'lucide-react'
import { Suspense, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PcListingsContent } from './components/PcListingsContent'
import { PcListingsFilters } from './components/PcListingsFilters'
import { PcListingsHeader } from './components/PcListingsHeader'

function PcListingsPageContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <div className="w-80 h-screen sticky top-0 overflow-y-auto p-6">
            <Suspense fallback={<LoadingSpinner />}>
              <PcListingsFilters />
            </Suspense>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar Content - Full width on mobile */}
            <div className="relative w-full flex">
              <div className="w-full bg-white dark:bg-gray-900 shadow-xl transform animate-slide-up">
                {/* Close button header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Filters
                  </h2>
                  <button
                    type="button"
                    aria-label="Close filters sidebar"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="h-full overflow-y-auto p-4">
                  <Suspense fallback={<LoadingSpinner />}>
                    <PcListingsFilters />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Floating Action Button for Filters - Mobile Only */}
      <div className="lg:hidden fixed bottom-14 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-110 transition-all duration-300 ease-out"
          aria-label="Open Filters"
        >
          <FunnelIcon className="w-6 h-6" />

          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
        </button>
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
