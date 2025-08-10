'use client'

import { RedirectToSignIn, SignedIn, SignedOut, useUser } from '@clerk/nextjs'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission as hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import AdminNavbar from './components/AdminNavbar'
import {
  adminNavItems,
  superAdminNavItems,
  moderatorNavItems,
  getDeveloperNavItems,
  type AdminNavItem,
} from './data'

function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, isLoaded } = useUser()

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // For developers, fetch their verified emulators
  const verifiedEmulatorsQuery = api.verifiedDevelopers.getMyVerifiedEmulators.useQuery(undefined, {
    enabled: !!userQuery.data && userQuery.data.role === Role.DEVELOPER,
  })

  // Get pending games count for admin navigation
  const gameStatsQuery = api.games.getStats.useQuery(undefined, {
    enabled:
      !!userQuery.data && hasPermission(userQuery.data.permissions, PERMISSIONS.VIEW_STATISTICS),
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // Get pending listings count for admin navigation
  const listingStatsQuery = api.listings.getStats.useQuery(undefined, {
    enabled:
      !!userQuery.data && hasPermission(userQuery.data.permissions, PERMISSIONS.VIEW_STATISTICS),
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // Get pending PC listings count for admin navigation
  const pcListingStatsQuery = api.pcListings.stats.useQuery(undefined, {
    enabled:
      !!userQuery.data && hasPermission(userQuery.data.permissions, PERMISSIONS.VIEW_STATISTICS),
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const isSuperAdmin = hasRolePermission(userQuery.data?.role, Role.SUPER_ADMIN)

  // Get pending reports count for admin navigation
  const reportsStatsQuery = api.listingReports.getStats.useQuery(undefined, {
    enabled: !!userQuery.data && isSuperAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const isAdmin = hasRolePermission(userQuery.data?.role, Role.ADMIN)
  const isModerator = hasRolePermission(userQuery.data?.role, Role.MODERATOR)
  const isDeveloper = userQuery.data?.role === Role.DEVELOPER // Exact match, not hierarchical

  // New permission-based checks
  const hasAdminPanelAccess = hasPermission(
    userQuery.data?.permissions,
    PERMISSIONS.ACCESS_ADMIN_PANEL,
  )

  useEffect(() => {
    if (!isLoaded || userQuery.isPending || !user) return

    // Check if a user has the right permissions once data is loaded
    // Use permission-based access control
    if (userQuery.data && !hasAdminPanelAccess) {
      router.replace('/')
    }
  }, [isLoaded, user, userQuery.data, hasAdminPanelAccess, router, userQuery.isPending])

  if (!isLoaded || userQuery.isPending) return <LoadingSpinner size="lg" />

  if (!user || !userQuery.data) return null

  // Don't render admin content if user doesn't have admin panel access
  if (!hasAdminPanelAccess) return null

  // Create navigation items with counts
  const adminNavItemsWithCounts = adminNavItems.map((item) => {
    if (item.href === '/admin/games/approvals' && gameStatsQuery.data) {
      return { ...item, count: gameStatsQuery.data.pending }
    }
    if (item.href === '/admin/approvals' && listingStatsQuery.data) {
      return { ...item, count: listingStatsQuery.data.pending }
    }
    if (item.href === '/admin/pc-listing-approvals' && pcListingStatsQuery.data) {
      return { ...item, count: pcListingStatsQuery.data.pending }
    }
    return item
  })

  // Create super admin navigation items with counts
  const superAdminNavItemsWithCounts = superAdminNavItems.map((item) => {
    if (item.href === '/admin/reports' && reportsStatsQuery.data) {
      return { ...item, count: reportsStatsQuery.data.pending }
    }
    return item
  })

  // Select appropriate nav items based on a user role
  let navItems: AdminNavItem[] = []
  let superAdminItems: AdminNavItem[] = []

  if (isSuperAdmin) {
    navItems = adminNavItemsWithCounts
    superAdminItems = superAdminNavItemsWithCounts
  } else if (isAdmin) {
    navItems = adminNavItemsWithCounts
  } else if (isModerator) {
    navItems = moderatorNavItems.map((item) => {
      if (item.href === '/admin/games/approvals' && gameStatsQuery.data) {
        return { ...item, count: gameStatsQuery.data.pending }
      }
      if (item.href === '/admin/approvals' && listingStatsQuery.data) {
        return { ...item, count: listingStatsQuery.data.pending }
      }
      if (item.href === '/admin/pc-listing-approvals' && pcListingStatsQuery.data) {
        return { ...item, count: pcListingStatsQuery.data.pending }
      }
      return item
    })
  } else if (isDeveloper && verifiedEmulatorsQuery.data) {
    const emulatorIds = verifiedEmulatorsQuery.data.map((e) => e.id)
    navItems = getDeveloperNavItems(emulatorIds)
  }

  return (
    <>
      <SignedIn>
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <aside
            className={cn(
              'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
              isCollapsed ? 'w-20' : 'w-64',
            )}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              {!isCollapsed && (
                <Link href="/admin" className="font-bold text-gray-900 dark:text-white text-xl">
                  Admin
                </Link>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <AdminNavbar
              pathname={pathname}
              isCollapsed={isCollapsed}
              isSuperAdmin={isSuperAdmin}
              adminNavItems={navItems}
              superAdminNavItems={superAdminItems}
            />

            {/* Back to Site Link */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/"
                className={cn(
                  'flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  isCollapsed ? 'justify-center' : 'justify-start',
                )}
              >
                <Home className="w-5 h-5 min-w-5" />
                {!isCollapsed && <span className="ml-3">Back to Site</span>}
              </Link>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-1 sm:p-6 md:p-10 overflow-auto">
              <div className="max-w-full">{props.children}</div>
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default AdminLayout
