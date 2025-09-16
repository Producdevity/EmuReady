import { RedirectToSignIn } from '@clerk/nextjs'
import { type Metadata } from 'next'
import { getCurrentUser } from '@/server/utils/auth'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import { AdminDashboard } from './dashboard/AdminDashboard'
import {
  moderatorNavItems,
  adminNavItems,
  superAdminNavItems,
  getDeveloperNavItemsForUser,
} from './data'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user) return <RedirectToSignIn />

  if (!hasRolePermission(user.role, Role.DEVELOPER)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to access the admin dashboard.
        </p>
      </div>
    )
  }

  const isSuperAdmin = hasRolePermission(user.role, Role.SUPER_ADMIN)
  const isAdmin = hasRolePermission(user.role, Role.ADMIN)
  const isModerator = user.role === Role.MODERATOR
  const isDeveloper = user.role === Role.DEVELOPER

  // Get navigation items based on role
  let navItems: Awaited<ReturnType<typeof getDeveloperNavItemsForUser>> = []
  if (isSuperAdmin) {
    navItems = [...adminNavItems, ...superAdminNavItems]
  } else if (isAdmin) {
    navItems = adminNavItems
  } else if (isModerator) {
    navItems = moderatorNavItems
  } else if (isDeveloper) {
    // Get developer's verified emulators for navigation items
    navItems = await getDeveloperNavItemsForUser(user.id)
  }

  return <AdminDashboard userRole={user.role} navItems={navItems} />
}

export default AdminDashboardPage
