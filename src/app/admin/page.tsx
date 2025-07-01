import { RedirectToSignIn } from '@clerk/nextjs'
import { type Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/server/utils/auth'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import { moderatorNavItems, adminNavItems, superAdminNavItems } from './data'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user) return <RedirectToSignIn />

  if (!hasPermission(user.role, Role.DEVELOPER)) {
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
  const isAdmin = hasPermission(user.role, Role.ADMIN)
  const isModerator = user.role === Role.MODERATOR
  const isDeveloper = user.role === Role.DEVELOPER

  let welcomeMessage = 'Welcome!'
  let roleDescription = ''

  if (isSuperAdmin) {
    welcomeMessage = 'Welcome, Super Admin!'
    roleDescription = 'You have complete access to all administrative features.'
  } else if (isAdmin) {
    welcomeMessage = 'Welcome, Admin!'
    roleDescription =
      'Manage all systems, devices, emulators, performance scales, and approve new listings from this dashboard.'
  } else if (isModerator) {
    welcomeMessage = 'Welcome, Moderator!'
    roleDescription = 'You can manage devices and SoCs from this dashboard.'
  } else if (isDeveloper) {
    welcomeMessage = 'Welcome, Developer!'
    roleDescription =
      'You have access to manage your emulator settings and configurations.'
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {welcomeMessage}
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        {roleDescription}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isModerator &&
          moderatorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <h3 className="font-semibold text-xl mb-2">{item.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </Link>
          ))}
        {isAdmin &&
          adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <h3 className="font-semibold text-xl mb-2">{item.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </Link>
          ))}

        {isSuperAdmin &&
          superAdminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
            >
              <h3 className="font-semibold text-xl mb-2 text-purple-800 dark:text-purple-300">
                {item.label}
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                {item.description}
              </p>
            </Link>
          ))}
      </div>
    </div>
  )
}

export default AdminDashboardPage
