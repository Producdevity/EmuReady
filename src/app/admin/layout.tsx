'use client'

import { useEffect, useState, type PropsWithChildren } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Role } from '@orm'
import { hasPermission } from '@/utils/permissions'
import { LoadingSpinner, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { adminNav, superAdminNav } from './data'
import { api } from '@/lib/api'
import {
  ChevronLeft,
  Monitor,
  Gamepad2,
  Package,
  Smartphone,
  Play,
  Gauge,
  CheckSquare,
  Users,
  FileText,
} from 'lucide-react'

// Icon mapping for navigation items
const getNavIcon = (href: string, className: string = 'w-5 h-5') => {
  if (href.includes('/systems')) return <Monitor className={className} />
  if (href.includes('/games')) return <Gamepad2 className={className} />
  if (href.includes('/brands')) return <Package className={className} />
  if (href.includes('/devices')) return <Smartphone className={className} />
  if (href.includes('/emulators')) return <Play className={className} />
  if (href.includes('/performance')) return <Gauge className={className} />
  if (href.includes('/approvals')) return <CheckSquare className={className} />
  if (href.includes('/users')) return <Users className={className} />
  if (href.includes('/processed-listings'))
    return <FileText className={className} />
  return <Monitor className={className} />
}

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
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
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
                  isCollapsed 
                    ? 'rotate-180 transform' 
                    : 'rotate-0 transform'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNav.map((item) => {
            const linkElement = (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative ${
                  pathname.startsWith(item.href)
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-shrink-0">
                  {getNavIcon(item.href)}
                </div>
                <span 
                  className={`truncate transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )

            return isCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  {linkElement}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : linkElement
          })}

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="border-t border-gray-200 dark:border-gray-700" />
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
                  <p className="mt-4 px-3 text-sm uppercase font-semibold text-gray-500 dark:text-gray-400">
                    Super Admin
                  </p>
                </div>
              </div>
              {superAdminNav.map((item) => {
                const linkElement = (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative ${
                      pathname.startsWith(item.href)
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getNavIcon(item.href)}
                    </div>
                    <span 
                      className={`truncate transition-all duration-300 ease-in-out ${
                        isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                )

                return isCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkElement}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : linkElement
              })}
            </>
          )}
        </nav>
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
