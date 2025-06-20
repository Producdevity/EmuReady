import { RedirectToSignIn } from '@clerk/nextjs'
import { type Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/server/utils/auth'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import { adminNavItems, superAdminNavItems } from './data'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user) return <RedirectToSignIn />

  if (!hasPermission(user.role, Role.ADMIN)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to access the admin dashboard.
        </p>
      </div>
    )
  }

  const isSuperAdmin = hasPermission(user.role, Role.SUPER_ADMIN)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome, Admin!
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        Manage all systems, devices, emulators, performance scales, and approve
        new listings from this dashboard.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
              {item.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {item.description}
            </p>
          </Link>
        ))}

        {isSuperAdmin &&
          superAdminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block bg-gradient-to-r from-purple-50 to-white dark:from-purple-900 dark:to-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-purple-200 dark:border-purple-800"
            >
              <h2 className="text-xl font-semibold mb-2 text-purple-600 dark:text-purple-400">
                {item.label}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
            </Link>
          ))}
      </div>
    </div>
  )
}

export default AdminDashboardPage
