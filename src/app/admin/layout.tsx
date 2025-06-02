'use client'

import { useEffect, type PropsWithChildren } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Role } from '@orm'
import { hasPermission } from '@/utils/permissions'
import { LoadingSpinner } from '@/components/ui'
import { adminNav, superAdminNav } from './data'
import { api } from '@/lib/api'

function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  
  // Get user role from database using TRPC
  const { data: userData, isLoading: isUserDataLoading } = api.users.getProfile.useQuery(
    undefined,
    { enabled: !!user }
  )

  const userRole = userData?.role as Role | undefined
  const isSuperAdmin = userRole ? hasPermission(userRole, Role.SUPER_ADMIN) : false

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
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-8 text-indigo-600 dark:text-indigo-400">
            Admin Dashboard
          </h2>
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                `}
              >
                {item.label}
              </Link>
            ))}

            {isSuperAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <p className="mt-4 px-4 text-sm uppercase font-semibold text-gray-500 dark:text-gray-400">
                    Super Admin
                  </p>
                </div>
                {superAdminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                      pathname.startsWith(item.href)
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {props.children}
      </main>
    </div>
  )
}

export default AdminLayout
