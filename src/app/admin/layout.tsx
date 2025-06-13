'use client'

import { useUser } from '@clerk/nextjs'
import { ChevronLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import AdminNavbar from './components/AdminNavbar'
import { adminNavItems, superAdminNavItems } from './data'

function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, isLoaded } = useUser()

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // Get pending games count for admin navigation
  const gameStatsQuery = api.games.getStats.useQuery(undefined, {
    enabled:
      !!userQuery.data &&
      hasPermission(userQuery.data.role as Role, Role.ADMIN),
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
  })

  // Get pending listings count for admin navigation
  const listingStatsQuery = api.listings.getStats.useQuery(undefined, {
    enabled:
      !!userQuery.data &&
      hasPermission(userQuery.data.role as Role, Role.ADMIN),
    refetchInterval: 30000, // Refetch every 30 seconds (to keep counts updated)
  })

  const isSuperAdmin = hasPermission(userQuery.data?.role, Role.SUPER_ADMIN)

  useEffect(() => {
    if (!isLoaded || userQuery.isLoading) return

    if (!user) return router.replace('/sign-in')

    // Check if user has admin permissions once data is loaded
    if (userQuery.data && !hasPermission(userQuery.data?.role, Role.ADMIN)) {
      router.replace('/')
    }
  }, [
    isLoaded,
    user,
    userQuery.data,
    userQuery.data?.role,
    router,
    userQuery.isLoading,
  ])

  if (!isLoaded || userQuery.isLoading) return <LoadingSpinner size="lg" />

  if (!user || !userQuery.data) return null

  // Don't render admin content if user doesn't have admin role
  if (!hasPermission(userQuery.data?.role, Role.ADMIN)) return null

  // Create navigation items with counts
  const adminNavItemsWithCounts = adminNavItems.map((item) => {
    if (item.href === '/admin/games/approvals' && gameStatsQuery.data) {
      return { ...item, count: gameStatsQuery.data.pending }
    }
    if (item.href === '/admin/approvals' && listingStatsQuery.data) {
      return { ...item, count: listingStatsQuery.data.pending }
    }
    return item
  })

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-20' : 'w-64',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'transition-all duration-300 ease-in-out overflow-hidden',
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
              )}
            >
              <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                Admin Dashboard
              </h2>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex-shrink-0 group"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={cn(
                  'w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-500 ease-out group-hover:scale-110 group-active:scale-95',
                  isCollapsed ? 'rotate-180 transform' : 'rotate-0 transform',
                )}
              />
            </button>
          </div>
        </div>

        <AdminNavbar
          isCollapsed={isCollapsed}
          isSuperAdmin={isSuperAdmin}
          pathname={pathname}
          adminNavItems={adminNavItemsWithCounts}
          superAdminNavItems={superAdminNavItems}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="max-w-full">{props.children}</div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
