'use client'

import { useUser } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function PcListingsHeader() {
  const { isSignedIn } = useUser()

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden lg:flex lg:justify-between lg:items-center mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            PC Compatibility
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse compatibility reports for PC gaming setups and emulators
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn && (
            <Button asChild variant="fancy">
              <Link href="/pc-listings/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add PC Listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Header - Compact */}
      <div className="flex lg:hidden items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            PC Compatibility
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            PC gaming compatibility reports
          </p>
        </div>

        {/* Mobile Action Menu */}
        {isSignedIn && (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="fancy"
              size="sm"
              className="px-3 py-1.5 text-xs"
            >
              <Link href="/pc-listings/new" className="flex items-center">
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
