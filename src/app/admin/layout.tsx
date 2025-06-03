'use client'

import { useEffect, useState, type PropsWithChildren } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Role } from '@orm'
import { hasPermission } from '@/utils/permissions'
import { LoadingSpinner } from '@/components/ui'
import { adminNav, superAdminNav } from './data'
import { api } from '@/lib/api'
import { ChevronLeft } from 'lucide-react'
import AdminNavbar from './components/AdminNavbar'

function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Get user role from database using TRPC
  const { data: userData, isLoading: isUserDataLoading } =
    api.users.getProfile.useQuery(undefined, { enabled: !!user })

  const userRole = userData?.role as Role | undefined
  const isSuperAdmin = userRole
    ? hasPermission(userRole, Role.SUPER_ADMIN)
    : false

  useEffect(() => {
    if (!isLoaded || isUserDataLoading) return

    if (!user) {
      router.replace('/sign-in')
      return
    }

    // Check if user has admin permissions once data is loaded
    if (userData && (!userRole || !hasPermission(userRole, Role.ADMIN))) {
      router.replace('/')
    }
  }, [isLoaded, user, userData, userRole, router, isUserDataLoading])

  if (!isLoaded || isUserDataLoading) return <LoadingSpinner size="lg" />

  if (!user || !userData) return null

  // Don't render admin content if user doesn't have admin role
  if (!userRole || !hasPermission(userRole, Role.ADMIN)) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
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
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-all duration-500 ease-out group-hover:scale-110 group-active:scale-95 ${
                  isCollapsed ? 'rotate-180 transform' : 'rotate-0 transform'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <AdminNavbar
          isCollapsed={isCollapsed}
          isSuperAdmin={isSuperAdmin}
          pathname={pathname}
          adminNav={adminNav}
          superAdminNav={superAdminNav}
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
