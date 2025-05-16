'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const adminNav = [
  { href: '/admin/systems', label: 'Systems' },
  { href: '/admin/devices', label: 'Devices' },
  { href: '/admin/emulators', label: 'Emulators' },
  { href: '/admin/performance', label: 'Performance Scales' },
  { href: '/admin/listings', label: 'Listing Approvals' },
]

// Super admin only nav items
const superAdminNav = [
  { href: '/admin/users', label: 'Users Management' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

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
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>
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
        {children}
      </main>
    </div>
  )
}
