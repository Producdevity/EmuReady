import { RedirectToSignIn } from '@clerk/nextjs'
import { type Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getCurrentUser } from '@/server/utils/auth'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import { moderatorNavItems, adminNavItems, superAdminNavItems } from './data'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

const messages: Record<Role, { welcome: string; description: string }> = {
  [Role.USER]: {
    welcome: 'GTFO',
    description: 'How did you get here?',
  },
  [Role.AUTHOR]: {
    welcome: 'WTF.',
    description: 'You have no business being here.',
  },
  [Role.DEVELOPER]: {
    welcome: 'Welcome, Developer!',
    description:
      'You have access to manage your emulator settings, custom fields, and configurations. Build and maintain your emulation software integration.',
  },
  [Role.MODERATOR]: {
    welcome: 'Welcome, Moderator!',
    description:
      'You can manage games, devices, SoCs, approve listings, review user reports, and handle user bans. Help maintain community standards and platform quality.',
  },
  [Role.ADMIN]: {
    welcome: 'Welcome, Admin!',
    description:
      'Manage systems, games, devices, emulators, performance scales, verified developers, and approve listings. You have full control over platform content and configurations.',
  },
  [Role.SUPER_ADMIN]: {
    welcome: 'Welcome, Super Admin!',
    description:
      'You have complete access to all administrative features, including user management, trust system monitoring, permission controls, and advanced reporting capabilities.',
  },
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {messages[user.role]?.welcome || 'Welcome!'}
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        {messages[user.role]?.description || ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {isModerator &&
          moderatorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'bg-white dark:bg-gray-800',
                'p-6 rounded-lg',
                'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors',
                'transition-shadow shadow-md hover:shadow-lg',
              )}
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
              className={cn(
                'bg-white dark:bg-gray-800',
                'p-6 rounded-lg',
                'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors',
                'transition-shadow shadow-md hover:shadow-lg',
              )}
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
              className={cn(
                'bg-purple-50 dark:bg-purple-900/20',
                'p-6 rounded-lg',
                'border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors',
                'transition-shadow shadow-md hover:shadow-lg',
              )}
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
